import { reloadable } from '../../utils/tstl-utils';
import { PlayerHelper } from '../helper/player-helper';

@reloadable
export class GoldXPFilter {
  constructor() {
    GameRules.GetGameModeEntity().SetModifyGoldFilter((args) => this.filterGold(args), this);
    GameRules.GetGameModeEntity().SetModifyExperienceFilter((args) => this.filterXP(args), this);
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
      return true;
    }

    if (reason === ModifyGoldReason.HERO_KILL) {
      gold = this.filterHeroKillGold(gold);

      gold = gold * this.rewardFilterByKill(playerID);
      mul = this.filterHeroKillGoldByMultiplier(mul);
    }

    args.gold = Math.floor(gold * mul);

    return true;
  }

  filterHeroKillGold(gold: number): number {
    if (gold > 3200) {
      return gold / 8 + 1000;
    } else if (gold > 1600) {
      return gold / 4 + 600;
    } else if (gold > 400) {
      return gold / 2 + 200;
    } else {
      return gold * 1;
    }
  }

  private filterXP(args: ModifyExperienceFilterEvent): boolean {
    const xp = args.experience;
    const playerID = args.player_id_const;
    const reason = args.reason_const;
    let mul = this.getPlayerGoldXpMultiplier(playerID);

    if (reason === ModifyXpReason.HERO_KILL) {
      mul = this.filterHeroKillGoldByMultiplier(mul);
    }

    args.experience = Math.floor(xp * mul);

    return true;
  }

  /**
   * 根据玩家的击杀数相对于团队总击杀数计算奖励倍数。
   * 击杀数较多的玩家获得的奖励更少，击杀数较少的玩家获得的奖励更多。
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
   *
   * @param mul - The original gold multiplier.
   * @returns The adjusted gold multiplier.
   */
  filterHeroKillGoldByMultiplier(mul: number): number {
    if (mul <= 1) {
      return mul;
    }
    const reduceRate = 0.5;
    return 1 + (mul - 1) * reduceRate;
  }
}
