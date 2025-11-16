import { TowerPushStatus } from '../event/event-entity-killed';

/**
 * 英雄买活管理器
 * 负责管理买活金钱
 */
export class HeroBuyback {
  private readonly refreshInterval: number = 1; // 刷新策略间隔

  /**
   * 初始化买活金钱管理器
   */
  constructor() {
    Timers.CreateTimer(2, () => {
      this.refreshBuybackCost();
      return this.refreshInterval;
    });
  }

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
          PlayerResource.SetCustomBuybackCost(playerId, this.calculateBuybackCost(playerId));
          print(
            `[HeroBuyback] playerId: ${playerId}, buybackCost: ${this.calculateBuybackCost(playerId)}`,
          );
        } else {
          // 3塔未被推，禁止买活
          PlayerResource.SetCustomBuybackCost(playerId, 100000);
          print(`[HeroBuyback] playerId: ${playerId}, buybackCost: 100000`);
        }
      } else {
        // 真人玩家，正常买活
        PlayerResource.SetCustomBuybackCost(playerId, this.calculateBuybackCost(playerId));
      }
    }
  }

  /**
   * 计算买活金钱
   */
  private calculateBuybackCost(playerId: number): number {
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
