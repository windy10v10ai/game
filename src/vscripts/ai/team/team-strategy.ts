import { TowerPushStatus } from '../../modules/event/event-entity-killed';
import { BaseModifier, registerModifier } from '../../utils/dota_ts_adapter';

/**
 * 团队策略管理器
 * 负责管理电脑的推进策略和买活金钱策略
 */
@registerModifier()
export class TeamStrategy extends BaseModifier {
  protected readonly ThinkInterval: number = 10; // 每10秒刷新一次策略

  private botPushMin: number = 15; // 电脑开始推进的分钟数

  // ---------------------------------------------------------
  // DotaModifierFunctions
  // ---------------------------------------------------------
  OnCreated() {
    if (IsClient()) {
      return;
    }

    // 计算电脑推进时间
    this.calculateBotPushTime();

    const delay = 2;
    Timers.CreateTimer(delay, () => {
      this.StartIntervalThink(this.ThinkInterval);
    });
  }

  OnIntervalThink(): void {
    this.refreshPushStrategy();
    this.refreshBuybackCost();
  }

  IsPurgable(): boolean {
    return false;
  }

  RemoveOnDeath(): boolean {
    return false;
  }

  IsHidden(): boolean {
    return true;
  }

  // ---------------------------------------------------------
  // 推进策略
  // ---------------------------------------------------------

  /**
   * 根据难度计算电脑推进时间
   */
  private calculateBotPushTime(): void {
    const botGoldXpMultiplier = GameRules.Option.direGoldXpMultiplier || 1;

    if (botGoldXpMultiplier <= 3) {
      this.botPushMin = RandomInt(16, 20);
    } else if (botGoldXpMultiplier <= 5) {
      this.botPushMin = RandomInt(13, 16);
    } else if (botGoldXpMultiplier <= 8) {
      this.botPushMin = RandomInt(11, 13);
    } else if (botGoldXpMultiplier <= 10) {
      this.botPushMin = RandomInt(8, 10);
    } else if (botGoldXpMultiplier <= 20) {
      this.botPushMin = RandomInt(5, 7);
    } else {
      this.botPushMin = RandomInt(4, 5);
    }

    print(`[TeamStrategy] Bot push min: ${this.botPushMin}`);
  }

  /**
   * 刷新推进策略
   */
  private refreshPushStrategy(): void {
    const gameTime = GameRules.GetDOTATime(false, false);
    const gameModeEntity = GameRules.GetGameModeEntity();

    if (gameTime >= this.botPushMin * 4 * 60) {
      // LATEGAME - 无限制推进
      gameModeEntity.SetBotsMaxPushTier(-1);
    } else if (gameTime >= this.botPushMin * 1.3 * 60) {
      // MIDGAME
      if (TowerPushStatus.tower3PushedGood >= 2 || TowerPushStatus.tower3PushedBad >= 2) {
        gameModeEntity.SetBotsMaxPushTier(4);
      }

      if (TowerPushStatus.barrackPushedGood > 5 || TowerPushStatus.barrackPushedBad > 5) {
        gameModeEntity.SetBotsMaxPushTier(-1);
      } else if (TowerPushStatus.barrackPushedGood > 2 || TowerPushStatus.barrackPushedBad > 2) {
        gameModeEntity.SetBotsMaxPushTier(5);
      }
    } else if (gameTime >= this.botPushMin * 60) {
      // MIDGAME - 开始推进
      gameModeEntity.SetBotsInLateGame(true);
      gameModeEntity.SetBotsAlwaysPushWithHuman(true);
      gameModeEntity.SetBotsMaxPushTier(3);
    } else {
      // EARLYGAME - 保守策略
      gameModeEntity.SetBotsInLateGame(false);
      gameModeEntity.SetBotsAlwaysPushWithHuman(false);
      gameModeEntity.SetBotsMaxPushTier(1);
    }
  }

  // ---------------------------------------------------------
  // 买活金钱策略
  // ---------------------------------------------------------

  /**
   * 刷新买活金钱
   * 电脑只有在3塔被推后才能买活
   */
  private refreshBuybackCost(): void {
    for (let playerId = 0; playerId < PlayerResource.GetPlayerCount(); playerId++) {
      if (!PlayerResource.IsValidPlayerID(playerId)) {
        continue;
      }

      if (PlayerResource.IsFakeClient(playerId)) {
        // 电脑玩家
        if (TowerPushStatus.tower3PushedGood > 0 || TowerPushStatus.tower3PushedBad > 0) {
          // 3塔被推后，允许买活
          PlayerResource.SetCustomBuybackCost(playerId, this.getBuybackCost(playerId));
        } else {
          // 3塔未被推，禁止买活
          PlayerResource.SetCustomBuybackCost(playerId, 100000);
        }
      } else {
        // 真人玩家，正常买活
        PlayerResource.SetCustomBuybackCost(playerId, this.getBuybackCost(playerId));
      }
    }
  }

  /**
   * 计算买活金钱
   */
  private getBuybackCost(playerId: number): number {
    const hero = PlayerResource.GetSelectedHeroEntity(playerId as PlayerID);
    if (!hero) {
      return 0;
    }

    const level = hero.GetLevel();
    const netWorth = PlayerResource.GetNetWorth(playerId as PlayerID);

    // Dota 2 买活公式
    const baseCost = 100 + level * level * 1.5;
    const netWorthCost = netWorth * 0.0125;
    const totalCost = baseCost + netWorthCost;

    return Math.floor(totalCost);
  }
}
