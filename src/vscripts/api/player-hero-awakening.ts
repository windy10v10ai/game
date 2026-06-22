import { applyAwakenByHero } from '../modules/awaken/awaken-replacer';
import { ApiClient, HttpMethod } from './api-client';
import { Player, PlayerInfoDto } from './player';

/**
 * 积分解锁英雄觉醒：仅支持赛季积分（useMemberPoint 固定 false），失败原因（英雄名无效/
 * 已觉醒/积分不足/玩家不存在）均由前端发请求前预判规避，故失败时不区分文案，仅打日志。
 */
export class PlayerHeroAwakeningApi {
  constructor() {
    CustomGameEventManager.RegisterListener<AwakenUnlockHeroEventData>(
      'awaken_unlock_hero',
      (_, event) => this.onUnlockHero(event),
    );
  }

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
      successFunc: (data) =>
        PlayerHeroAwakeningApi.UnlockSuccess(data, playerId, steamId, event.heroName),
      failureFunc: (data) => PlayerHeroAwakeningApi.UnlockFailure(data, playerId),
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
    const isUnlocked = Player.GetAwakenedHeroes(steamId).some((h) => h.heroName === heroName);
    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (hero && isUnlocked) {
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
