import { LotteryDto } from '../../../../common/dto/lottery';
import { reloadable } from '../../../utils/tstl-utils';
import { AbilityLotteryHelper } from './ability-lottery-helper';
import { abilityTiersPassive } from './lottery-abilities';

/**
 * 被动技能书抽奖：使用技能书触发后弹 4 选 1，倒计时由客户端驱动，归零自动随机选 1。
 */
@reloadable
export class PassiveTomeLottery {
  static readonly CANDIDATE_COUNT = 4;

  constructor() {
    CustomGameEventManager.RegisterListener('lottery_pick_passive_tome', (_userId, event) => {
      this.pickAbility(event.PlayerID, event);
    });
  }

  onTriggered(hero: CDOTA_BaseNPC_Hero): void {
    const playerId = hero.GetPlayerOwnerID();
    if (playerId < 0) return;

    const candidates = AbilityLotteryHelper.getRandomAbilities(
      abilityTiersPassive,
      PassiveTomeLottery.CANDIDATE_COUNT,
      hero,
      [],
      true,
    );
    CustomNetTables.SetTableValue('lottery_passive_tome', playerId.toString(), { candidates });
  }

  pickAbility(playerId: PlayerID, event: LotteryPickItemEventData): void {
    const raw = CustomNetTables.GetTableValue('lottery_passive_tome', playerId.toString());
    if (!raw) {
      print('[PassiveTomeLottery] no pending lottery for player ' + playerId);
      return;
    }
    // TSTL 把 array 编码成 object 同步给客户端，读回时也是 object，按值列出
    const candidates = Object.values(raw.candidates ?? {}) as unknown as LotteryDto[];
    const matched = candidates.find((c) => c.name === event.name && c.level === event.level);
    if (!matched) {
      print('[PassiveTomeLottery] candidate not found for player ' + playerId + ': ' + event.name);
      return;
    }

    const hero = PlayerResource.GetSelectedHeroEntity(playerId);
    if (!hero) {
      print('[PassiveTomeLottery] hero not found for player ' + playerId);
      return;
    }

    hero.AddAbility(matched.name);
    print('[PassiveTomeLottery] player ' + playerId + ' picked ' + matched.name);

    // 清空候选（写空数组，客户端 candidates.length === 0 → UI collapse）。
    // 不能传 nil：Dota 引擎对 SetTableValue 传 nil 是 noop，不会删除行。
    CustomNetTables.SetTableValue('lottery_passive_tome', playerId.toString(), { candidates: [] });
  }
}
