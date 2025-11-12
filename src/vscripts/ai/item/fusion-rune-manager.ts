// 创建文件: src/vscripts/ai/item/fusion-rune-manager.ts
import { reloadable } from '../../utils/tstl-utils';

interface FusionRuneConfig {
  itemName: string;
  baseStockTimeMinutes: number;
  stockSpeedMinutes: number;
  initialStock: number;
  maxStock: number;
}

// FIXME暂时未使用，保留以缓解代码冲突
@reloadable
export class FusionRuneManager {
  // 8种符文配置
  private static readonly RUNES: FusionRuneConfig[] = [
    {
      itemName: 'item_fusion_hawkeye',
      baseStockTimeMinutes: 12,
      stockSpeedMinutes: 4,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_forbidden',
      baseStockTimeMinutes: 12,
      stockSpeedMinutes: 4,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_brutal',
      baseStockTimeMinutes: 16,
      stockSpeedMinutes: 4,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_beast',
      baseStockTimeMinutes: 10,
      stockSpeedMinutes: 3,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_life',
      baseStockTimeMinutes: 15,
      stockSpeedMinutes: 4,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_shadow',
      baseStockTimeMinutes: 12,
      stockSpeedMinutes: 4,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_magic',
      baseStockTimeMinutes: 20,
      stockSpeedMinutes: 5,
      initialStock: 0,
      maxStock: 3,
    },
    {
      itemName: 'item_fusion_agile',
      baseStockTimeMinutes: 16,
      stockSpeedMinutes: 3,
      initialStock: 0,
      maxStock: 3,
    },
  ];

  /**
   * 根据难度倍率获取时间倍数
   * 倍率越高，时间越短（倍数越小）
   */
  private static GetDifficultyTimeMultiplier(): number {
    const multiplier = GameRules.Option.direGoldXpMultiplier;

    if (multiplier >= 100) {
      return 0.6; // 100倍及以上，时间减少70%
    } else if (multiplier >= 60) {
      return 0.7; // 60倍，时间减少60%
    } else if (multiplier >= 30) {
      return 0.8; // 30倍，时间减少50%
    } else if (multiplier >= 20) {
      return 0.9; // 20倍，时间减少40%
    } else if (multiplier >= 12) {
      return 1.0; // 12倍，时间减少20%
    } else if (multiplier >= 8) {
      return 1.1; // 8倍，正常时间
    } else if (multiplier >= 4) {
      return 1.2; // 4倍，时间增加20%
    } else {
      return 1.5; // 低倍率，时间增加50%
    }
  }

  /**
   * 计算初始库存时间（秒）
   * @param baseMinutes 基础时间（分钟）
   */
  private static CalculateBaseStockTime(baseMinutes: number): number {
    const timeMultiplier = this.GetDifficultyTimeMultiplier();
    return baseMinutes * 60 * timeMultiplier;
  }

  /**
   * 计算库存补充间隔时间（秒）
   * @param speedMinutes 基础补充间隔（分钟）
   */
  private static CalculateStockSpeed(speedMinutes: number): number {
    const timeMultiplier = this.GetDifficultyTimeMultiplier();
    return speedMinutes * 60 * timeMultiplier;
  }

  // 初始化符文库存系统
  public static InitializeFusion(): void {
    const gameMode = GameRules.GetGameModeEntity();

    if (!gameMode) {
      print('[FusionRune] GameMode entity not found!');
      return;
    }

    print('[FusionRune] Initializing fusion rune stock system...');
    print(`[FusionRune] Difficulty multiplier: ${GameRules.Option.direGoldXpMultiplier}`);
    print(`[FusionRune] Time multiplier: ${this.GetDifficultyTimeMultiplier()}`);

    // 为每个符文设置库存
    this.RUNES.forEach((rune) => {
      try {
        // 设置初始库存
        GameRules.SetItemStockCount(rune.initialStock, DotaTeam.GOODGUYS, rune.itemName, -1);
        GameRules.SetItemStockCount(rune.initialStock, DotaTeam.BADGUYS, rune.itemName, -1);

        // 计算初始库存时间和补充间隔
        const baseStockTimeSeconds = this.CalculateBaseStockTime(rune.baseStockTimeMinutes);
        const stockSpeedSeconds = this.CalculateStockSpeed(rune.stockSpeedMinutes);

        print(`[FusionRune] ${rune.itemName}:`);
        print(`  - Initial stock: ${rune.initialStock}, Max stock: ${rune.maxStock}`);
        print(
          `  - Base stock time: ${baseStockTimeSeconds}s (base: ${rune.baseStockTimeMinutes}min)`,
        );
        print(`  - Stock speed: ${stockSpeedSeconds}s (base: ${rune.stockSpeedMinutes}min)`);

        // 设置定时补充库存
        this.SetupStockReplenishment(rune, baseStockTimeSeconds, stockSpeedSeconds);
      } catch (error) {
        print(`[FusionRune] Error setting up ${rune.itemName}: ${error}`);
      }
    });

    print(`[FusionRune] Initialized ${this.RUNES.length} fusion runes`);
  }

  /**
   * 设置库存定时补充
   * @param rune 符文配置
   * @param initialDelay 初始延迟（秒）
   * @param intervalSeconds 补充间隔（秒）
   */
  private static SetupStockReplenishment(
    rune: FusionRuneConfig,
    initialDelay: number,
    intervalSeconds: number,
  ): void {
    // 首次补充在 initialDelay 后触发
    Timers.CreateTimer(initialDelay, () => {
      // 为两个队伍增加库存(最多到maxStock)
      GameRules.IncreaseItemStock(DotaTeam.GOODGUYS, rune.itemName, 1, -1);
      GameRules.IncreaseItemStock(DotaTeam.BADGUYS, rune.itemName, 1, -1);

      print(`[FusionRune] ${rune.itemName}: Stock increased (first time after ${initialDelay}s)`);

      // 后续按 intervalSeconds 间隔补充
      Timers.CreateTimer(intervalSeconds, () => {
        GameRules.IncreaseItemStock(DotaTeam.GOODGUYS, rune.itemName, 1, -1);
        GameRules.IncreaseItemStock(DotaTeam.BADGUYS, rune.itemName, 1, -1);

        print(`[FusionRune] ${rune.itemName}: Stock increased (interval: ${intervalSeconds}s)`);

        // 继续定时补充
        return intervalSeconds;
      });

      // 不返回值，因为后续补充由新的定时器处理
      return undefined;
    });
  }
}
