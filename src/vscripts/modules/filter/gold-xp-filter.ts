import { reloadable } from '../../utils/tstl-utils';
import { TowerPushStatus } from '../event/event-entity-killed';
import { PlayerHelper } from '../helper/player-helper';
import { farmRewardBonus } from './comeback-reward';

/** 多人局从开局准备阶段到开局 2 分半内，击杀金币与经验先统一按一半结算。 */
export function earlyKillRewardRate(gameTime: number): number {
  return gameTime < 150 ? 0.5 : 1;
}

/** 过滤器里暂时扣下的击杀金币，等击杀事件按击杀者附近的塔与真人情况决定补不补。 */
export interface KillGoldCut {
  playerId: PlayerID;
  gold: number;
  at: number;
}

/** 过滤器里暂时扣下的击杀经验，同上。 */
export interface KillXpCut {
  playerId: PlayerID;
  xp: number;
  at: number;
}

@reloadable
export class GoldXPFilter {
  private readonly REDUCE_RATE_3_MIN = 0.6;
  private readonly REDUCE_RATE_6_MIN = 0.8;
  private readonly REDUCE_RATE_HERO_KILL = 0.5;

  private readonly KILL_CUT_TTL = 2;
  private killGoldCuts: KillGoldCut[] = [];
  private killXpCuts: KillXpCut[] = [];

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

    if (reason === ModifyGoldReason.CREEP_KILL || reason === ModifyGoldReason.NEUTRAL_KILL) {
      gold = gold * this.getFarmRewardBonus(playerID);
    }

    let value = Math.floor(gold * mul);

    // 过滤器先于击杀事件触发，分不出击杀者和助攻者，击杀金币先整体压一半；
    // 击杀事件确认击杀者附近有敌方塔或没有其他真人后，再由 HeroKillReward 决定谁的扣减补回
    if (reason === ModifyGoldReason.HERO_KILL && PlayerHelper.IsMultiplayerGame()) {
      const rate = earlyKillRewardRate(GameRules.GetDOTATime(false, true));
      const cut = value - Math.floor(value * rate);
      if (cut > 0) {
        this.killGoldCuts.push({ playerId: playerID, gold: cut, at: GameRules.GetGameTime() });
        value = value - cut;
      }
    }

    args.gold = value;

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
    let xp = args.experience;
    const playerID = args.player_id_const;
    const reason = args.reason_const;
    let mul = this.getPlayerGoldXpMultiplier(playerID);

    if (reason === ModifyXpReason.HERO_KILL) {
      mul = this.filterHeroKillGoldByMultiplier(mul);
    }

    if (reason === ModifyXpReason.CREEP_KILL) {
      xp = xp * this.getFarmRewardBonus(playerID);
    }

    let value = Math.floor(xp * mul);

    // 击杀经验也只能整体先扣，等击杀事件确认击杀者附近情况后再决定补回
    if (reason === ModifyXpReason.HERO_KILL && PlayerHelper.IsMultiplayerGame()) {
      const rate = earlyKillRewardRate(GameRules.GetDOTATime(false, true));
      const cut = value - Math.floor(value * rate);
      if (cut > 0) {
        this.killXpCuts.push({ playerId: playerID, xp: cut, at: GameRules.GetGameTime() });
        value = value - cut;
      }
    }

    args.experience = value;

    return true;
  }

  /**
   * 取走 fromTime 之后记录的击杀金币扣减，供击杀结算按击杀者附近情况补回。
   *
   * @param fromTime - 只取这个时间点之后的记录，其余留给别的击杀或超时清理。
   */
  TakeKillGoldCuts(fromTime: number): KillGoldCut[] {
    const result = this.splitCuts(this.killGoldCuts, fromTime);
    this.killGoldCuts = result[1];
    return result[0];
  }

  /** 取走 fromTime 之后记录的击杀经验扣减，规则同击杀金币。 */
  TakeKillXpCuts(fromTime: number): KillXpCut[] {
    const result = this.splitCuts(this.killXpCuts, fromTime);
    this.killXpCuts = result[1];
    return result[0];
  }

  private splitCuts<T extends { at: number }>(cuts: T[], fromTime: number): [T[], T[]] {
    const now = GameRules.GetGameTime();
    const due: T[] = [];
    const keep: T[] = [];
    for (const cut of cuts) {
      if (now - cut.at > this.KILL_CUT_TTL) {
        continue;
      }
      if (cut.at >= fromTime) {
        due.push(cut);
      } else {
        keep.push(cut);
      }
    }
    return [due, keep];
  }

  /**
   * 真人玩家丢塔后打野与补兵的收益倍数，电脑玩家保持原收益。
   *
   * @param playerID - 要计算收益倍数的玩家ID。
   * @returns 按己方丢塔数计算的收益倍数。
   */
  private getFarmRewardBonus(playerID: PlayerID): number {
    if (!PlayerHelper.IsHumanPlayerByPlayerId(playerID)) {
      return 1;
    }

    // 字段按推掉塔的一方命名：天辉的塔被推掉记在 Bad，夜魇的记在 Good
    const towersLost =
      PlayerResource.GetTeam(playerID) === DotaTeam.GOODGUYS
        ? TowerPushStatus.tower1PushedBad +
          TowerPushStatus.tower2PushedBad +
          TowerPushStatus.tower3PushedBad +
          TowerPushStatus.tower4PushedBad
        : TowerPushStatus.tower1PushedGood +
          TowerPushStatus.tower2PushedGood +
          TowerPushStatus.tower3PushedGood +
          TowerPushStatus.tower4PushedGood;

    return farmRewardBonus(towersLost);
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

  /** 玩家所属阵营的基础金币经验倍率，不含开局前期的额外衰减。 */
  public getModeGoldXpMultiplier(playerID: PlayerID): number {
    // 所有人类玩家都使用天辉倍率
    if (PlayerHelper.IsHumanPlayerByPlayerId(playerID)) {
      return GameRules.Option.radiantGoldXpMultiplier;
    }
    if (PlayerHelper.IsGoodTeamPlayer(playerID)) {
      // Bot玩家在天辉队伍使用天辉倍率
      return GameRules.Option.radiantGoldXpMultiplier;
    }
    // Bot玩家在夜魇队伍使用夜魇倍率
    return GameRules.Option.direGoldXpMultiplier;
  }

  public getPlayerGoldXpMultiplier(playerID: PlayerID): number {
    let mul = this.getModeGoldXpMultiplier(playerID);

    // 游戏前期降低倍率
    const gameTime = GameRules.GetDOTATime(false, false);
    if (gameTime < 180) {
      mul = this.filterMultiplier(mul, this.REDUCE_RATE_3_MIN);
    } else if (gameTime < 360) {
      mul = this.filterMultiplier(mul, this.REDUCE_RATE_6_MIN);
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
    return this.filterMultiplier(mul, this.REDUCE_RATE_HERO_KILL);
  }

  /**
   * 降低倍率，不低于1
   *
   * @param mul - The original gold multiplier.
   * @param reduceRate - The reduce rate.
   * @returns The adjusted multiplier.
   */
  filterMultiplier(mul: number, reduceRate: number): number {
    if (mul <= 1) {
      return mul;
    }
    return 1 + (mul - 1) * reduceRate;
  }
}
