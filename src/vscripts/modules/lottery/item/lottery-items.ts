import { Tier } from '../shared/tier';

/**
 * 物品抽奖池，Tier 7-1。配合 POOL_RATES 累计阈值使用（见 item-lottery-helper）。
 */
export const itemTiers: Tier[] = [
  // 超高价值成长/通用资源
  {
    level: 7,
    names: [
      'item_tome_of_luoshu', // 洛书
      'item_universal_rune', // 通用符文
      'item_passive_skill_tome', // 被动技能书
    ],
  },
  // 终极物品
  {
    level: 6,
    names: [
      'item_fusion_hawkeye', // 鹰眼符文
      'item_fusion_forbidden', // 禁忌符文
      'item_fusion_brutal', // 暴虐符文
      'item_fusion_beast', // 兽化符文
      'item_fusion_life', // 生命符文
      'item_fusion_shadow', // 暗影符文
      'item_fusion_magic', // 魔化符文
      'item_fusion_agile', // 灵动符文
    ],
  },
  {
    level: 5,
    names: [
      'item_awaken_stone', // 觉醒石
    ],
  },
  // 特殊物品
  {
    level: 4,
    names: [
      'item_tome_of_ability_reset', // 技能重选书
      'item_tome_of_agility', // 敏捷之书
      'item_tome_of_intelligence', // 智力之书
      'item_tome_of_strength', // 力量之书
      'item_ultimate_scepter_2', // 真·阿哈利姆神杖
      'item_hydras_breath', // 怪蛇之息
      'item_roshans_banner', // 肉山的战旗
      'item_light_part', // 圣光组件
      'item_dark_part', // 暗影组件
    ],
  },
  // 3~5k
  {
    level: 3,
    names: [
      'item_rune_transmuter_advanced', // 转化石
      'item_consumable_gem', // 幻影宝石
      'item_candy_candy', // 嘉心糖
      'item_solar_crest', // 炎阳纹章
      'item_aether_lens_2', // 以太之镜
      'item_wings_of_haste', // 急速之翼
      'item_crellas_crozier', // 克莱拉牧杖
      'item_specialists_array', // 行家阵列
      'item_hand_of_group', // 团队之手
    ],
  },
  // 2k
  {
    level: 2,
    names: [
      // 'item_collector', // 收纳符
      'item_rune_transmuter_random', // 洗炼石
      'item_tome_of_knowledge', // 知识之书
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_great_famango', // 大疗伤莲花
      'item_hand_of_midas', // 点金手
      'item_force_staff', // 原力法杖
      'item_glimmer_cape', // 微光披风
      'item_essence_distiller', // 精之灵器
      'item_ancient_janggo', // 韧鼓
      'item_holy_locket', // 圣洁吊坠
      'item_consecrated_wraps', // 圣化护服
    ],
  },
  // 1k
  {
    level: 1,
    names: [
      'item_foragers_stats', // 铁树坚果
      'item_foragers_mana', // 托莫干伞盖
      'item_foragers_health', // 活力伞菌
      'item_bracer', // 护腕
      'item_wraith_band', // 系带
      'item_null_talisman', // 挂件
      'item_infused_raindrop', // 凝魂之露
      'item_magic_wand', // 魔棒
      'item_bottle', // 魔瓶
      'item_arcane_boots', // 秘法鞋
      'item_phase_boots', // 相位鞋
      'item_power_treads', // 动力鞋
    ],
  },
];
