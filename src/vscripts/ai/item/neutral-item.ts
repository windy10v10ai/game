// 中立物品配置接口
export interface NeutralItemConfig {
  name: string; // 物品名称
  weight?: number; // 权重(用于概率计算，默认为1)
}

// 中立物品tier配置
export interface NeutralTierConfig {
  items: NeutralItemConfig[]; // 主动物品列表
  enhancements: NeutralItemConfig[]; // 被动增强列表
}

// 中立物品管理类
export class NeutralItemManager {
  // 获取各tier开始时间
  private static GetTierStartTimes(): number[] {
    const multiplier = GameRules.Option.direGoldXpMultiplier;
    // 根据multiplier计算tier开始时间
    if (multiplier >= 10) {
      // 立刻获取中立物品
      return [0, 360, 720, 1080, 1440];
    } else if (multiplier >= 8) {
      //延后1分钟
      return [60, 420, 780, 1140, 1500];
    } else if (multiplier >= 6) {
      //延后2分钟
      return [120, 480, 840, 1200, 1560];
    } else if (multiplier >= 4) {
      //延后3分钟
      return [180, 540, 900, 1260, 1620];
    } else {
      // 延后5分钟
      return [300, 660, 1020, 1380, 1740];
    }
  }

  // 获取默认配置
  public static GetDefaultConfig(): Record<number, NeutralTierConfig> {
    return {
      1: {
        items: [
          { name: 'item_trusty_shovel' },
          { name: 'item_occult_bracelet' },
          { name: 'item_mana_draught' },
          { name: 'item_polliwog_charm' },
          { name: 'item_spark_of_courage' },
          { name: 'item_rippers_lash' },
          { name: 'item_iron_talon' },
          { name: 'item_safety_bubble' },
        ],
        enhancements: [
          { name: 'item_enhancement_mystical' },
          { name: 'item_enhancement_brawny' },
          { name: 'item_enhancement_alert' },
          { name: 'item_enhancement_tough' },
          { name: 'item_enhancement_quickened' },
          { name: 'item_enhancement_greedy' },
          { name: 'item_enhancement_wise' },
        ],
      },
      2: {
        items: [
          { name: 'item_essence_ring' },
          { name: 'item_searing_signet' },
          { name: 'item_misericorde' },
          { name: 'item_orb_of_destruction' },
          { name: 'item_royal_jelly' },
          { name: 'item_arcane_ring' },
          { name: 'item_poor_mans_shield' },
          { name: 'item_chipped_vest' },
        ],
        enhancements: [
          { name: 'item_enhancement_mystical' },
          { name: 'item_enhancement_brawny' },
          { name: 'item_enhancement_alert' },
          { name: 'item_enhancement_tough' },
          { name: 'item_enhancement_quickened' },
          { name: 'item_enhancement_greedy' },
          { name: 'item_enhancement_wise' },
          { name: 'item_enhancement_keen_eyed' },
          { name: 'item_enhancement_vast' },
          { name: 'item_enhancement_vampiric' },
        ],
      },
      // ... 其他tier的配置
    };
  }

  // 获取当前tier
  public static GetTargetTier(): number {
    const gameTime = GameRules.GetDOTATime(false, false);
    const startTimes = this.GetTierStartTimes();

    for (let i = startTimes.length - 1; i >= 0; i--) {
      if (gameTime >= startTimes[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  // 获取指定tier的物品名
  public static GetRandomTierItemName(
    tier: number,
    neutralItemConfig: Record<number, NeutralTierConfig>,
  ): string | undefined {
    const items = neutralItemConfig[tier]?.items || [];
    if (items.length === 0) return undefined;

    return this.SelectRandomItemName(items);
  }

  // 获取指定tier的增强名
  public static GetRandomTierEnhancements(
    tier: number,
    neutralItemConfig: Record<number, NeutralTierConfig>,
  ): string | undefined {
    const enhancements = neutralItemConfig[tier]?.enhancements || [];
    if (enhancements.length === 0) return undefined;

    return this.SelectRandomItemName(enhancements);
  }

  // 根据权重随机选择物品
  public static SelectRandomItemName(items: NeutralItemConfig[]): string | undefined {
    if (items.length === 0) return undefined;

    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = RandomFloat(0, totalWeight);

    for (const item of items) {
      random -= item.weight || 1;
      if (random <= 0) {
        return item.name;
      }
    }

    return items[0].name;
  }
}
