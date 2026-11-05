import { reloadable } from '../../utils/tstl-utils';
import { TowerPushStatus } from '../event/event-entity-killed';
import { PlayerHelper } from '../helper/player-helper';
import { farmRewardBonus } from './comeback-reward';

/** 多人局从开局准备阶段到开局 2 分半内的英雄击杀金币衰减。 */
export function earlyKillGoldRate(gameTime: number): number {
  return gameTime < 150 ? 0.7 : 1;
}

/** 同一窗口内击杀经验的衰减，无助攻时击杀者只拿到一半，有助攻时由击杀结算补回。 */
export function earlyKillXpRate(gameTime: number): number {
  return gameTime < 150 ? 0.5 : 1;
}

/** 过滤器里暂时扣下的击杀经验，等确认这次击杀有没有助攻再决定补不补。 */
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

  private readonly KILL_XP_CUT_TTL = 2;
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

      // 过滤器先于击杀事件触发，拿不到击杀/助攻信息，这里只能整体压前期击杀金币；
      // 助攻与击杀者的助攻加成由 HeroKillReward 在击杀后补发
      if (PlayerHelper.IsMultiplayerGame()) {
        // 带负时间才能把开局准备阶段也算进衰减窗口
        gold = gold * earlyKillGoldRate(GameRules.GetDOTATime(false, true));
      }

      gold = gold * this.rewardFilterByKill(playerID);
      mul = this.filterHeroKillGoldByMultiplier(mul);
    }

    if (reason === ModifyGoldReason.CREEP_KILL || reason === ModifyGoldReason.NEUTRAL_KILL) {
      gold = gold * this.getFarmRewardBonus(playerID);
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

    // 击杀经验的扣减同样只能整体先扣，等击杀事件确认没有助攻后再保留
    if (reason === ModifyXpReason.HERO_KILL && PlayerHelper.IsMultiplayerGame()) {
      const rate = earlyKillXpRate(GameRules.GetDOTATime(false, true));
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
   * 取走 fromTime 之后记录的击杀经验扣减，供击杀结算按助攻情况补回。
   *
   * @param fromTime - 只取这个时间点之后的记录，其余留给别的击杀或超时清理。
   */
  TakeKillXpCuts(fromTime: number): KillXpCut[] {
    const now = GameRules.GetGameTime();
    const due: KillXpCut[] = [];
    const keep: KillXpCut[] = [];
    for (const cut of this.killXpCuts) {
      if (now - cut.at > this.KILL_XP_CUT_TTL) {
        continue;
      }
      if (cut.at >= fromTime) {
        due.push(cut);
      } else {
        keep.push(cut);
      }
    }
    this.killXpCuts = keep;
    return due;
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
