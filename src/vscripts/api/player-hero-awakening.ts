import { getAwakenHeroNames } from '../modules/awaken/awaken-config';
import {
  AWAKEN_RANDOM_CANDIDATE_COUNT,
  pickRandomCandidates,
} from '../modules/awaken/awaken-random';
import { applyAwakenByHero } from '../modules/awaken/awaken-replacer';
import { ApiClient, HttpMethod } from './api-client';
import { Player, PlayerInfoDto } from './player';

/**
 * 积分解锁英雄觉醒：仅支持赛季积分（useMemberPoint 固定 false），失败原因（英雄名无效/
 * 已觉醒/积分不足/玩家不存在）均由前端发请求前预判规避，故失败时不区分文案，仅打日志。
 *
 * 随机抽选（半价）：候选集由 API 账号级持久化，game 侧只负责建议候选与展示。
 * 半价由 API 内部按「heroName 命中候选集」派生，认领仍走同一直购端点、IF 不变。
 */
export class PlayerHeroAwakeningApi {
  constructor() {
    CustomGameEventManager.RegisterListener<AwakenUnlockHeroEventData>(
      'awaken_unlock_hero',
      (_, event) => this.onUnlockHero(event),
    );
    CustomGameEventManager.RegisterListener('awaken_random_request', (_, event) =>
      this.onRandomRequest(event),
    );
  }

  /**
   * 直购与随机认领共用：半价由 API 按 heroName 是否命中候选集派生，game 无需区分。
   * 成功后统一清空候选集净表行（无候选时即空行，无害），使前端候选层收起。
   */
  private onUnlockHero(event: { PlayerID: PlayerID; heroName: string }) {
    const playerId = event.PlayerID;
    const steamId = PlayerResource.GetSteamAccountID(playerId);
    ApiClient.sendWithRetry({
      method: HttpMethod.PUT,
      path: `/player/${steamId}/hero-awakening`,
      body: {
        heroName: event.heroName,
        useMemberPoint: false,
      },
      successFunc: (data) => {
        PlayerHeroAwakeningApi.UnlockSuccess(data, playerId, steamId, event.heroName);
        CustomNetTables.SetTableValue('awaken_random', steamId.toString(), {});
      },
      failureFunc: (data) => PlayerHeroAwakeningApi.UnlockFailure(data, playerId),
    });
  }

  private onRandomRequest(event: { PlayerID: PlayerID }) {
    const playerId = event.PlayerID;
    const steamId = PlayerResource.GetSteamAccountID(playerId);
    const awakenedHeroes = Player.GetAwakenedHeroes(steamId).map((h) => h.heroName);
    const candidates = pickRandomCandidates(
      getAwakenHeroNames(),
      awakenedHeroes,
      AWAKEN_RANDOM_CANDIDATE_COUNT,
    );
    // 剩余可觉醒 < 3，随机不可用（前端按钮本应禁用，此处兜底不发请求）
    if (candidates.length < AWAKEN_RANDOM_CANDIDATE_COUNT) {
      return;
    }
    ApiClient.sendWithRetry({
      method: HttpMethod.PUT,
      path: `/player/${steamId}/hero-awakening/random`,
      body: { candidates },
      successFunc: (data) => {
        // 必须用 API 返回的候选：账号已有未消费候选集时 API 忽略本次 body、原样返回旧值（防重刷）
        const result = json.decode(data)[0] as { candidates: string[] };
        CustomNetTables.SetTableValue('awaken_random', steamId.toString(), {
          candidates: result.candidates,
        });
      },
      failureFunc: (data) => print(`[PlayerHeroAwakening] random request failed: ${data}`),
    });
  }

  private static UnlockSuccess(
    data: string,
    playerId: PlayerID,
    steamId: number,
    heroName: string,
  ) {
    const player = json.decode(data)[0] as PlayerInfoDto;
    Player.MergePlayerInfo(player);
    // 以合并后的真实记录为准，避免响应体异常缺字段时仍误赋技能
    const awakenConfirmed = Player.GetAwakenedHeroes(steamId).some((h) => h.heroName === heroName);
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    // 只觉醒当前英雄本体；解锁的是其它英雄时留到下局出生由 AwakenHelper 应用
    if (hero && awakenConfirmed && hero.GetUnitName() === heroName) {
      applyAwakenByHero(hero);
    }
    PlayerHeroAwakeningApi.notifyResult(playerId);
  }

  private static UnlockFailure(data: string, playerId: PlayerID) {
    print(`[PlayerHeroAwakening] UnlockHero failed: ${data}`);
    PlayerHeroAwakeningApi.notifyResult(playerId);
  }

  private static notifyResult(playerId: PlayerID) {
    const player = PlayerResource.GetPlayer(playerId);
    if (player) {
      CustomGameEventManager.Send_ServerToPlayer(player, 'awaken_unlock_result', {});
    }
  }
}
