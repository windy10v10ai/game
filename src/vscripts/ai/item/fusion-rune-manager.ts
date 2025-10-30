// 创建文件: src/vscripts/ai/item/fusion-rune-manager.ts

interface FusionRuneConfig {
  itemName: string;
  baseStockTimeMinutes: number; // 初始化库存时间(分钟)
  StockSpeedMinutes: number; //库存补充时间
  initialStock: number; // 初始库存
  maxStock: number; // 最大库存
}

export class FusionRuneManager {
  // 8种符文配置
  private static readonly RUNES: FusionRuneConfig[] = [
    {
      itemName: 'item_fusion_hawkeye',
      baseStockTimeMinutes: 15,
      StockSpeedMinutes: 3,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_forbidden',
      baseStockTimeMinutes: 15,
      StockSpeedMinutes: 3,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_brutal',
      baseStockTimeMinutes: 16,
      StockSpeedMinutes: 4,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_beast',
      baseStockTimeMinutes: 8,
      StockSpeedMinutes: 2,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_life',
      baseStockTimeMinutes: 12,
      StockSpeedMinutes: 3,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_shadow',
      baseStockTimeMinutes: 15,
      StockSpeedMinutes: 3,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_magic',
      baseStockTimeMinutes: 20,
      StockSpeedMinutes: 4,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_agile',
      baseStockTimeMinutes: 16,
      StockSpeedMinutes: 3,
      initialStock: 0,
      maxStock: 3,
    },
  ];

  // 根据倍率计算库存补充时间(秒)
  private static CalculateStockTime(baseMinutes: number): number {
    const multiplier = GameRules.Option.direGoldXpMultiplier;
    let timeMultiplier = 1.0;

    // 倍率越高,库存时间越快
    if (multiplier >= 100) {
      timeMultiplier = 0.5; // 20倍及以上,库存时间减少70%
    } else if (multiplier >= 60) {
      timeMultiplier = 0.6; // 10倍,库存时间减少50%
    } else if (multiplier >= 30) {
      timeMultiplier = 0.7; // 8倍,库存时间减少40%
    } else if (multiplier >= 20) {
      timeMultiplier = 0.8; // 6倍,库存时间减少30%
    } else if (multiplier >= 12) {
      timeMultiplier = 1; // 4倍,库存时间减少20%
    } else {
      timeMultiplier = 1.2; // 默认倍率,不减少
    }

    return baseMinutes * 60 * timeMultiplier;
  }

  // 初始化符文库存系统
  public static InitializeOnWindyKilled(): void {
    const gameMode = GameRules.GetGameModeEntity();

    if (!gameMode) {
      print('[FusionRune] GameMode entity not found!');
      return;
    }

    print('[FusionRune] Initializing fusion rune stock system...');

    // 为每个符文设置库存
    this.RUNES.forEach((rune) => {
      try {
        // 设置初始库存
        GameRules.SetItemStockCount(rune.initialStock, DotaTeam.GOODGUYS, rune.itemName, -1);
        GameRules.SetItemStockCount(rune.initialStock, DotaTeam.BADGUYS, rune.itemName, -1);

        const stockTimeSeconds = this.CalculateStockTime(rune.baseStockTimeMinutes);

        print(
          `[FusionRune] ${rune.itemName}: stock=${rune.initialStock}, time=${stockTimeSeconds}s (base=${rune.baseStockTimeMinutes}min)`,
        );

        // 设置定时补充库存
        this.SetupStockReplenishment(rune, stockTimeSeconds);
      } catch (error) {
        print(`[FusionRune] Error setting up ${rune.itemName}: ${error}`);
      }
    });

    print(
      `[FusionRune] Initialized ${this.RUNES.length} fusion runes with multiplier ${GameRules.Option.direGoldXpMultiplier}`,
    );
  }

  // 设置库存定时补充
  private static SetupStockReplenishment(rune: FusionRuneConfig, intervalSeconds: number): void {
    Timers.CreateTimer(intervalSeconds, () => {
      // 为两个队伍增加库存(最多到maxStock)
      GameRules.IncreaseItemStock(DotaTeam.GOODGUYS, rune.itemName, 1, -1);
      GameRules.IncreaseItemStock(DotaTeam.BADGUYS, rune.itemName, 1, -1);

      // 继续定时补充
      return intervalSeconds;
    });
  }
}
