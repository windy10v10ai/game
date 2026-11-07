import { reloadable } from '../../utils/tstl-utils';
import { TowerPushStatus } from '../event/event-entity-killed';
import { PlayerHelper } from '../helper/player-helper';
import { farmRewardBonus } from './comeback-reward';

@reloadable
export class GoldXPFilter {
  private readonly REDUCE_RATE_3_MIN = 0.6;
  private readonly REDUCE_RATE_6_MIN = 0.8;
  private readonly REDUCE_RATE_HERO_KILL = 0.5;
  private readonly KILL_SHARE_MIN_TEAM_KILLS = 10;
  // 多人局强势玩家的领先在开局就形成，要更早介入
  private readonly KILL_SHARE_MIN_TEAM_KILLS_MULTIPLAYER = 5;

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

    if (this.GOLD_REASON_NOT_FILTER.includes(reason)) {
      return true;
    }

    if (reason === ModifyGoldReason.HERO_KILL) {
      args.gold = this.getHeroKillGold(playerID, gold);
      return true;
    }

    const mul = this.getPlayerGoldXpMultiplier(playerID);

    if (reason === ModifyGoldReason.CREEP_KILL || reason === ModifyGoldReason.NEUTRAL_KILL) {
      gold = gold * this.getFarmRewardBonus(playerID);
    }

    args.gold = Math.floor(gold * mul);

    return true;
  }

  /**
   * 计算一笔英雄击杀金币的实际到账值。
   *
   * @param playerID - 收钱的玩家ID。
   * @param gold - 过滤前的金币。
   * @returns 实际到账的金币。
   */
  getHeroKillGold(playerID: PlayerID, gold: number): number {
    const mul = this.filterHeroKillGoldByMultiplier(this.getPlayerGoldXpMultiplier(playerID));
    return Math.floor(this.filterHeroKillGold(gold) * this.rewardFilterByKill(playerID) * mul);
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
      if (this.isMultiplayerRadiant(playerID)) {
        xp = xp * this.rewardFilterByKill(playerID);
      }
    }

    if (reason === ModifyXpReason.CREEP_KILL) {
      xp = xp * this.getFarmRewardBonus(playerID);
    }

    args.experience = Math.floor(xp * mul);

    return true;
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
   * @returns 玩家奖励倍数。团队总击杀数未到门槛时倍数为1，多人局天辉的门槛更低；
   *          否则，倍数根据玩家的击杀数与团队总击杀数计算得出。
   */
  rewardFilterByKill(playerID: PlayerID): number {
    const playerKill = PlayerResource.GetKills(playerID);
    const teamKill = PlayerResource.GetTeamKills(PlayerResource.GetTeam(playerID));
    const teamCount = PlayerResource.GetPlayerCountForTeam(PlayerResource.GetTeam(playerID));

    const minTeamKills = this.isMultiplayerRadiant(playerID)
      ? this.KILL_SHARE_MIN_TEAM_KILLS_MULTIPLAYER
      : this.KILL_SHARE_MIN_TEAM_KILLS;

    let rewardMulti = 1;
    if (teamKill < minTeamKills) {
      return rewardMulti;
    }
    rewardMulti = 1 + (1 / teamCount - playerKill / teamKill) / 2;
    return rewardMulti;
  }

  private isMultiplayerRadiant(playerID: PlayerID): boolean {
    return PlayerHelper.IsGoodTeamPlayer(playerID) && PlayerHelper.IsMultiplayerGame();
  }

  public getPlayerGoldXpMultiplier(playerID: PlayerID): number {
    let mul = 1;

    // 所有人类玩家都使用天辉倍率
    if (PlayerHelper.IsHumanPlayerByPlayerId(playerID)) {
      mul = GameRules.Option.radiantGoldXpMultiplier;
    } else if (PlayerHelper.IsGoodTeamPlayer(playerID)) {
      // Bot玩家在天辉队伍使用天辉倍率
      mul = GameRules.Option.radiantGoldXpMultiplier;
    } else {
      // Bot玩家在夜魇队伍使用夜魇倍率
      mul = GameRules.Option.direGoldXpMultiplier;
    }

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
