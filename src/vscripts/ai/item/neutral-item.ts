// 中立物品配置接口
export interface NeutralItemConfig {
  name: string; // 物品名称
  level: number; // 物品等级
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
    const baseTimeMin = [0, 6, 12, 18, 24];
    const multiplier = GameRules.Option.direGoldXpMultiplier;

    let addTimeMin = [0, 0, 0, 0, 0];
    // 根据multiplier计算tier开始时间
    if (multiplier >= 20) {
      // 立刻获取中立物品
      addTimeMin = [0, 0, 0, 0, 0];
    } else if (multiplier >= 10) {
      //延后1分钟
      addTimeMin = [1, 1, 1, 1, 2];
    } else if (multiplier >= 8) {
      //延后2分钟
      addTimeMin = [2, 2, 2, 3, 4];
    } else if (multiplier >= 6) {
      //延后3分钟
      addTimeMin = [3, 3, 4, 5, 6];
    } else if (multiplier >= 4) {
      //延后4分钟
      addTimeMin = [4, 5, 6, 7, 9];
    } else {
      // 延后6分钟
      addTimeMin = [6, 7, 8, 9, 12];
    }

    const baseTime = baseTimeMin.map((time, index) => time * 60 + addTimeMin[index] * 60);
    return baseTime;
  }

  // 获取默认配置
  public static GetDefaultConfig(): Record<number, NeutralTierConfig> {
    return {
      1: {
        items: [
          // { name: 'item_trusty_shovel', level: 1 }, // 可靠铁铲 电脑挖了后不会拾取道具
          { name: 'item_occult_bracelet', level: 1 },
          { name: 'item_polliwog_charm', level: 1 },
          { name: 'item_spark_of_courage', level: 1 },
          // { name: 'item_rippers_lash', level: 1 },
          { name: 'item_safety_bubble', level: 1 },
          // { name: 'item_dormant_curio', level: 1 }, // 休眠珍品
          { name: 'item_kobold_cup', level: 1 }, // 狗头人酒杯
          { name: 'item_sisters_shroud', level: 1 }, // 魅影之衣
          { name: 'item_royal_jelly', level: 1 },
        ],
        enhancements: [
          { name: 'item_enhancement_mystical', level: 1 },
          { name: 'item_enhancement_brawny', level: 1 },
          { name: 'item_enhancement_alert', level: 1 },
          { name: 'item_enhancement_tough', level: 1 },
          { name: 'item_enhancement_quickened', level: 1 },
          { name: 'item_enhancement_greedy', level: 1 },
          { name: 'item_enhancement_wise', level: 1 },
        ],
      },
      2: {
        items: [
          { name: 'item_essence_ring', level: 1 },
          { name: 'item_searing_signet', level: 1 },
          { name: 'item_misericorde', level: 1 },
          { name: 'item_orb_of_destruction', level: 1 },
          { name: 'item_arcane_ring', level: 1 },
          { name: 'item_poor_mans_shield', level: 1 },
          { name: 'item_chipped_vest', level: 1 },
          { name: 'item_mana_draught', level: 1 },
        ],
        enhancements: [
          { name: 'item_enhancement_mystical', level: 2 },
          { name: 'item_enhancement_brawny', level: 2 },
          { name: 'item_enhancement_alert', level: 2 },
          { name: 'item_enhancement_tough', level: 2 },
          { name: 'item_enhancement_quickened', level: 2 },
          { name: 'item_enhancement_greedy', level: 2 },
          { name: 'item_enhancement_wise', level: 2 },
          { name: 'item_enhancement_keen_eyed', level: 1 },
          { name: 'item_enhancement_vast', level: 1 },
          { name: 'item_enhancement_vampiric', level: 1 },
        ],
      },
      3: {
        items: [
          { name: 'item_gale_guard', level: 1 },
          { name: 'item_whisper_of_the_dread', level: 1 },
          // { name: 'item_ninja_gear', level: 1 },
          { name: 'item_jidi_pollen_bag', level: 1 },
          { name: 'item_psychic_headband', level: 1 },
          { name: 'item_gunpowder_gauntlets', level: 1 },
          // { name: 'item_ogre_seal_totem', level: 1 },
          { name: 'item_spider_legs', level: 1 },
          { name: 'item_trickster_cloak', level: 1 },
          { name: 'item_penta_edged_sword', level: 1 },
        ],
        enhancements: [
          { name: 'item_enhancement_mystical', level: 3 },
          { name: 'item_enhancement_brawny', level: 3 },
          { name: 'item_enhancement_alert', level: 3 },
          { name: 'item_enhancement_tough', level: 3 },
          { name: 'item_enhancement_quickened', level: 3 },
          { name: 'item_enhancement_keen_eyed', level: 2 },
          { name: 'item_enhancement_vast', level: 2 },
          { name: 'item_enhancement_vampiric', level: 2 },
          { name: 'item_enhancement_feverish', level: 1 },
          { name: 'item_enhancement_evolved', level: 1 },
        ],
      },
      4: {
        items: [
          { name: 'item_crippling_crossbow', level: 1 },
          { name: 'item_pyrrhic_cloak', level: 1 },
          { name: 'item_fallen_sky', level: 1 },
          { name: 'item_panic_button', level: 1 },
          { name: 'item_serrated_shiv', level: 1 },
          { name: 'item_havoc_hammer', level: 1 },
          { name: 'item_seer_stone', level: 1 },
          { name: 'item_princes_knife', level: 1 },
          { name: 'item_stormcrafter', level: 1 },
          { name: 'item_repair_kit', level: 1 },
          { name: 'item_giant_maul', level: 1 },
          { name: 'item_outworld_staff', level: 1 },
        ],
        enhancements: [
          { name: 'item_enhancement_mystical', level: 4 },
          { name: 'item_enhancement_brawny', level: 4 },
          { name: 'item_enhancement_alert', level: 4 },
          { name: 'item_enhancement_tough', level: 4 },
          { name: 'item_enhancement_quickened', level: 4 },
          { name: 'item_enhancement_vampiric', level: 3 },
          { name: 'item_enhancement_timeless', level: 1 },
          { name: 'item_enhancement_titanic', level: 1 },
          { name: 'item_enhancement_crude', level: 1 },
          { name: 'item_enhancement_boundless', level: 1 },
          { name: 'item_enhancement_evolved', level: 2 },
        ],
      },
      5: {
        items: [
          { name: 'item_desolator_2', level: 1 },
          { name: 'item_minotaur_horn', level: 1 },
          { name: 'item_divine_regalia', level: 1 }, // 天赐华冠
          { name: 'item_helm_of_the_undying', level: 1 }, // 不朽尸王的头盔
          { name: 'item_nemesis_curse', level: 1 },
          { name: 'item_ceremonial_robe', level: 1 },
          { name: 'item_magnifying_monocle', level: 1 },
          { name: 'item_unrelenting_eye', level: 1 },
          { name: 'item_dezun_bloodrite', level: 1 },
          { name: 'item_mirror_shield', level: 1 },
          { name: 'item_ballista', level: 1 },
          { name: 'item_imp_claw', level: 1 },
          { name: 'item_giants_ring', level: 1 },
          { name: 'item_ex_machina', level: 1 },
          { name: 'item_specialists_array', level: 1 },
        ],
        enhancements: [
          { name: 'item_enhancement_timeless', level: 2 },
          { name: 'item_enhancement_titanic', level: 2 },
          { name: 'item_enhancement_crude', level: 2 },
          { name: 'item_enhancement_fleetfooted', level: 1 },
          { name: 'item_enhancement_audacious', level: 1 },
          { name: 'item_enhancement_evolved', level: 3 },
          { name: 'item_enhancement_boundless', level: 2 },
          { name: 'item_mysterious_hat', level: 2 },
          { name: 'item_spell_prism', level: 1 },
          { name: 'item_paladin_sword', level: 1 },
        ],
      },
    };
  }

  // 获取当前tier
  public static GetTargetTier(): number {
    const gameTime = GameRules.GetDOTATime(false, false);
    const startTimes = this.GetTierStartTimes();

    for (let i = startTimes.length - 1; i >= 0; i--) {
      if (gameTime > startTimes[i]) {
        return i + 1;
      }
    }
    return 0;
  }

  // 获取指定tier的物品名
  public static GetRandomTierItem(
    tier: number,
    neutralItemConfig: Record<number, NeutralTierConfig>,
  ): NeutralItemConfig | undefined {
    const items = neutralItemConfig[tier]?.items || [];
    if (items.length === 0) return undefined;

    return this.SelectRandomItem(items);
  }

  // 获取指定tier的增强名
  public static GetRandomTierEnhancements(
    tier: number,
    neutralItemConfig: Record<number, NeutralTierConfig>,
  ): NeutralItemConfig | undefined {
    const enhancements = neutralItemConfig[tier]?.enhancements || [];
    if (enhancements.length === 0) return undefined;

    return this.SelectRandomItem(enhancements);
  }

  // 根据权重随机选择物品
  public static SelectRandomItem(items: NeutralItemConfig[]): NeutralItemConfig | undefined {
    if (items.length === 0) return undefined;

    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = RandomFloat(0, totalWeight);

    for (const item of items) {
      random -= item.weight || 1;
      if (random <= 0) {
        return item;
      }
    }

    return items[0];
  }
}
