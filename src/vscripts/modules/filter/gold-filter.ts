import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

@reloadable
export class GoldFilter {
  constructor() {
    GameRules.GetGameModeEntity().SetModifyGoldFilter((args) => this.filterGold(args), this);
  }

  readonly GOLD_REASON_NOT_FILTER: ModifyGoldReason[] = [
    ModifyGoldReason.UNSPECIFIED,
    ModifyGoldReason.DEATH,
    ModifyGoldReason.BUYBACK,
    ModifyGoldReason.PURCHASE_CONSUMABLE,
    ModifyGoldReason.PURCHASE_ITEM,
    ModifyGoldReason.ABANDONED_REDISTRIBUTE,
    ModifyGoldReason.SELL_ITEM,
    ModifyGoldReason.ABILITY_COST,
    ModifyGoldReason.CHEAT_COMMAND,
    ModifyGoldReason.SELECTION_PENALTY,
    ModifyGoldReason.GAME_TICK,

    // ModifyGoldReason.BUILDING,
    // ModifyGoldReason.HERO_KILL,
    // ModifyGoldReason.CREEP_KILL,
    // ModifyGoldReason.NEUTRAL_KILL,
    // ModifyGoldReason.ROSHAN_KILL,
    // ModifyGoldReason.COURIER_KILL,
    // ModifyGoldReason.BOUNTY_RUNE,
    // ModifyGoldReason.SHARED_GOLD,
    // ModifyGoldReason.ABILITY_GOLD,
    // ModifyGoldReason.WARD_KILL,
    // ModifyGoldReason.COURIER_KILLED_BY_THIS_PLAYER,
  ];

  private filterGold(args: ModifyGoldFilterEvent): boolean {
    let gold = args.gold;
    const playerID = args.player_id_const;
    const reason = args.reason_const;
    let mul = this.getPlayerGoldXpMultiplier(playerID);

    if (this.GOLD_REASON_NOT_FILTER.includes(reason)) {
      return false;
    }

    if (reason === ModifyGoldReason.HERO_KILL) {
      if (gold > 2000) {
        gold = gold / 8 + 650;
      } else if (gold > 1200) {
        gold = gold / 4 + 400;
      } else if (gold > 200) {
        gold = gold / 2 + 100;
      } else {
        gold = gold * 1;
      }

      gold = gold * this.rewardFilterByKill(playerID);
      mul = this.filterHeroKillGoldByMultiplier(mul);
    }

    args.gold = Math.floor(gold * mul);

    return true;
  }

  /**
   * 根据玩家的击杀数相对于团队总击杀数计算奖励倍数。
   * 击杀数较多的玩家获得的奖励更少，击杀数较少的玩家获得的奖励更多。
   * 如果10人团队中，0击杀，则额外奖励5%
   * 如果10人团队中，所有人击杀数相等，则额外奖励0%
   * 如果10人团队中，拿了一半人头，则额外奖励-25%
   *
   * @param playerID - 要计算奖励倍数的玩家ID。
   * @returns 玩家奖励倍数。如果团队总击杀数小于10，倍数为1；
   *          否则，倍数根据玩家的击杀数与团队总击杀数计算得出。
   */
  rewardFilterByKill(playerID: PlayerID): number {
    const playerKill = PlayerResource.GetKills(playerID);
    const teamKill = PlayerResource.GetTeamKills(PlayerResource.GetTeam(playerID));
    const teamCount = PlayerResource.GetPlayerCountForTeam(PlayerResource.GetTeam(playerID));

    let rewardMulti = 1;
    if (teamKill < 10) {
      return rewardMulti;
    }
    rewardMulti = 1 + (1 / teamCount - playerKill / teamKill) / 2;
    return rewardMulti;
  }

  getPlayerGoldXpMultiplier(playerID: PlayerID): number {
    let mul = 1;

    if (PlayerHelper.IsGoodTeamPlayer(playerID)) {
      mul = GameRules.Option.radiantGoldXpMultiplier;
    } else {
      mul = GameRules.Option.direGoldXpMultiplier;
    }

    return mul;
  }

  /**
   * 降低高倍率时，击杀英雄的金钱奖励。
   * input: 1.5, output: 2
   * input: 4, output: 3
   * input: 10, output: 6
   *
   * @param mul - The original gold multiplier.
   * @returns The adjusted gold multiplier.
   */
  filterHeroKillGoldByMultiplier(mul: number): number {
    if (mul <= 1) {
      return mul;
    }
    const reduceRate = 0.8;
    return 1 + (mul - 1) * reduceRate;
  }
}
