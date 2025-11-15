// 创建文件: src/vscripts/ai/item/fusion-rune-manager.ts
import { reloadable } from '../../utils/tstl-utils';

interface FusionRuneConfig {
  itemName: string;
  initialStockTimeSeconds: number;
  stockTimeSeconds: number;
  initialStock: number;
  maxStock: number;
}

// 定义符文的中英文名称映射
const runeNames = {
  item_fusion_hawkeye: { zh: '鹰眼符文', en: 'Hawkeye Fusion' },
  item_fusion_forbidden: { zh: '禁忌符文', en: 'Forbidden Fusion' },
  item_fusion_brutal: { zh: '暴虐符文', en: 'Brutal Fusion' },
  item_fusion_beast: { zh: '兽化符文', en: 'Beast Fusion' },
  item_fusion_life: { zh: '生命符文', en: 'Life Fusion' },
  item_fusion_shadow: { zh: '暗影符文', en: 'Shadow Fusion' },
  item_fusion_magic: { zh: '魔化符文', en: 'Magic Fusion' },
  item_fusion_agile: { zh: '灵动符文', en: 'Agile Fusion' },
};

@reloadable
export class FusionRuneManager {
  // 符文物品名称列表
  private static readonly RUNE_ITEM_NAMES = [
    'item_fusion_hawkeye',
    'item_fusion_forbidden',
    'item_fusion_brutal',
    'item_fusion_beast',
    'item_fusion_life',
    'item_fusion_shadow',
    'item_fusion_magic',
    'item_fusion_agile',
  ];

  private static runeConfigs: FusionRuneConfig[] = [];

  /**
   * 从物品定义中读取符文配置
   */
  private static LoadRuneConfigs(): void {
    this.runeConfigs = [];

    this.RUNE_ITEM_NAMES.forEach((itemName) => {
      // 从物品KV定义中读取配置
      const itemKV = LoadKeyValues(`scripts/npc/npc_items_custom.txt`)?.[itemName];

      if (itemKV) {
        this.runeConfigs.push({
          itemName: itemName,
          initialStockTimeSeconds: (parseInt(itemKV.ItemInitialStockTime) || 720) - 60, // 减去60秒
          stockTimeSeconds: parseInt(itemKV.ItemStockTime) || 240,
          initialStock: parseInt(itemKV.ItemStockInitial) || 0,
          maxStock: parseInt(itemKV.ItemStockMax) || 3,
        });

        print(
          `[FusionRune] Loaded config for ${itemName}: initial=${itemKV.ItemInitialStockTime}s (actual: ${(parseInt(itemKV.ItemInitialStockTime) || 720) - 60}s), interval=${itemKV.ItemStockTime}s`,
        );
      } else {
        print(`[FusionRune] Warning: Could not load config for ${itemName}`);
      }
    });

    print(`[FusionRune] Loaded ${this.runeConfigs.length} rune configurations`);
  }

  /**
   * 获取高难度额外刷新配置
   */
  private static GetHighDifficultyConfig(): {
    shouldAddExtra: boolean;
  } {
    const multiplier = GameRules.Option.direGoldXpMultiplier;

    if (multiplier >= 40 || multiplier >= 20) {
      return {
        shouldAddExtra: true,
      };
    }

    return {
      shouldAddExtra: false,
    };
  }

  // 初始化符文库存系统
  public static InitializeFusion(): void {
    const gameMode = GameRules.GetGameModeEntity();

    if (!gameMode) {
      print('[FusionRune] GameMode entity not found!');
      return;
    }

    // 从物品定义加载配置
    this.LoadRuneConfigs();

    if (this.runeConfigs.length === 0) {
      print('[FusionRune] No rune configs loaded!');
      return;
    }

    const multiplier = GameRules.Option.direGoldXpMultiplier;
    const difficultyConfig = this.GetHighDifficultyConfig();

    print('[FusionRune] Initializing fusion rune stock system...');
    print(`[FusionRune] Difficulty multiplier: ${multiplier}`);
    print(`[FusionRune] High difficulty extra refresh: ${difficultyConfig.shouldAddExtra}`);

    // 为每个符文设置额外的动态库存
    this.runeConfigs.forEach((rune) => {
      try {
        print(`[FusionRune] ${rune.itemName}:`);
        print(`  - Initial stock: ${rune.initialStock}, Max stock: ${rune.maxStock}`);
        print(`  - Initial time: ${rune.initialStockTimeSeconds}s`);
        print(`  - Stock interval: ${rune.stockTimeSeconds}s`);

        // 设置额外的动态库存补充
        this.SetupExtraStockRefresh(rune, difficultyConfig);
      } catch (error) {
        print(`[FusionRune] Error setting up ${rune.itemName}: ${error}`);
      }
    });

    print(`[FusionRune] Initialized ${this.runeConfigs.length} fusion runes`);
  }

  /**
   * 设置额外的库存刷新(仅处理高难度的额外刷新)
   */
  private static SetupExtraStockRefresh(
    rune: FusionRuneConfig,
    difficultyConfig: ReturnType<typeof FusionRuneManager.GetHighDifficultyConfig>,
  ): void {
    const runeInfo = runeNames[rune.itemName];
    const runeName = runeInfo ? `${runeInfo.zh} (${runeInfo.en})` : rune.itemName;

    // 生成KV库存时间序列(前20个时间点)
    const kvTimeSequence: number[] = [];
    kvTimeSequence.push(rune.initialStockTimeSeconds);
    for (let i = 1; i < 20; i++) {
      kvTimeSequence.push(rune.initialStockTimeSeconds + i * rune.stockTimeSeconds);
    }

    print(
      `[FusionRune] ${rune.itemName}: KV time sequence: ${kvTimeSequence.slice(0, 5).join(', ')}...`,
    );

    // 如果是高难度,计算动态库存时间序列并设置额外刷新
    if (difficultyConfig.shouldAddExtra) {
      const multiplier = GameRules.Option.direGoldXpMultiplier;
      const timeMultiplier = multiplier >= 40 ? 0.6 : 0.8;

      // 计算缩短后的初始时间和间隔
      const scaledInitialTime = rune.initialStockTimeSeconds * timeMultiplier;
      const scaledInterval = rune.stockTimeSeconds * timeMultiplier;

      // 生成动态库存时间序列
      const dynamicTimeSequence: number[] = [];
      let currentTime = scaledInitialTime;

      // 生成足够多的动态时间点(生成20个)
      for (let i = 0; i < 20; i++) {
        dynamicTimeSequence.push(currentTime);
        currentTime += scaledInterval;
      }

      print(
        `[FusionRune] ${rune.itemName}: Dynamic time sequence: ${dynamicTimeSequence.slice(0, 5).join(', ')}...`,
      );

      // 对比两个序列,决定是否在动态时间点增加库存
      const threshold = scaledInterval / 2;
      let extraRefreshCount = 0;

      dynamicTimeSequence.forEach((dynamicTime) => {
        // 检查这个动态时间点是否与任意KV时间点太接近
        let tooClose = false;

        for (const kvTime of kvTimeSequence) {
          const timeDiff = Math.abs(dynamicTime - kvTime);
          if (timeDiff < threshold) {
            tooClose = true;
            print(
              `[FusionRune] ${rune.itemName}: Skipping dynamic time ${dynamicTime}s (too close to KV time ${kvTime}s, diff: ${timeDiff}s < threshold: ${threshold}s)`,
            );
            break;
          }
        }

        // 如果不太接近,则在这个时间点增加额外库存
        if (!tooClose) {
          extraRefreshCount++;
          const refreshIndex = extraRefreshCount;

          Timers.CreateTimer(dynamicTime, () => {
            GameRules.IncreaseItemStock(DotaTeam.GOODGUYS, rune.itemName, 1, -1);
            GameRules.IncreaseItemStock(DotaTeam.BADGUYS, rune.itemName, 1, -1);

            print(`[FusionRune] ${rune.itemName}: Extra stock #${refreshIndex} at ${dynamicTime}s`);
            GameRules.SendCustomMessage(
              `${runeName}已为高难度玩家单独增配/refreshed (Extra #${refreshIndex})`,
              1,
              0,
            );
            return undefined;
          });

          print(
            `[FusionRune] ${rune.itemName}: Scheduled extra refresh #${refreshIndex} at ${dynamicTime}s`,
          );
        }
      });

      print(`[FusionRune] ${rune.itemName}: Scheduled ${extraRefreshCount} extra refreshes`);
    }
  }
}
