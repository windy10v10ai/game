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
   * 原生 bot 期间电脑不能买活，接管后由团队大脑决定何时买活
   */
  private refreshBuybackCost(): void {
    for (let playerId = 0; playerId < PlayerResource.GetPlayerCount(); playerId++) {
      if (!PlayerResource.IsValidPlayerID(playerId)) {
        continue;
      }

      if (PlayerResource.IsFakeClient(playerId)) {
        // 电脑玩家
        if (GameRules.AI.BotTeam?.IsNativeActive() === false) {
          PlayerResource.SetCustomBuybackCost(playerId, this.calculateBuybackCost(playerId));
        } else {
          // 原生 bot 自己会买活，对线期买活只会浪费金钱
          PlayerResource.SetCustomBuybackCost(playerId, 100000);
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
