import { Tier } from '../shared/tier';

/**
 * 物品抽奖池，Tier 5-1。配合 ITEM_TIER_RATES [1,5,20,60,100] 累计阈值使用。
 * 单格出现概率：T5 1% / T4 4% / T3 15% / T2 40% / T1 40%
 */
export const itemTiers: Tier[] = [
  // 终极物品
  {
    level: 5,
    names: [
      'item_fusion_hawkeye', // 鹰眼符文
      'item_fusion_forbidden', // 禁忌符文
      'item_fusion_brutal', // 暴虐符文
      'item_fusion_beast', // 兽化符文
      'item_fusion_life', // 生命符文
      'item_fusion_shadow', // 暗影符文
      'item_fusion_magic', // 魔化符文
      'item_fusion_agile', // 灵动符文
      'item_tome_of_ability_reset', // 技能重选书
      'item_tome_of_agility', // 敏捷之书
      'item_tome_of_intelligence', // 智力之书
      'item_tome_of_strength', // 力量之书
    ],
  },
  // 特殊物品
  {
    level: 4,
    names: [
      'item_light_part', // 圣光组件
      'item_dark_part', // 暗影组件
      'item_ultimate_scepter_2', // 真·阿哈利姆神杖
      'item_consumable_gem', // 幻影宝石
      'item_rune_transmuter_advanced', // 转化石
      'item_candy_candy', // 嘉心糖
      'item_meteor_hammer_2', // 星落
    ],
  },
  // 3~5k
  {
    level: 3,
    names: [
      'item_tome_of_knowledge', // 知识之书
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_solar_crest', // 炎阳纹章
      'item_aether_lens_2', // 以太之镜
      'item_wings_of_haste', // 急速之翼
      'item_crellas_crozier', // 克莱拉牧杖
      'item_specialists_array', // 行家阵列
      'item_hand_of_group', // 团队之手
    ],
  },
  // 1~2k
  {
    level: 2,
    names: [
      'item_great_famango', // 大疗伤莲花
      'item_arcane_boots', // 秘法鞋
      'item_phase_boots', // 相位鞋
      'item_power_treads', // 动力鞋
      'item_hand_of_midas', // 点金手
      'item_force_staff', // 原力法杖
      'item_glimmer_cape', // 微光披风
      'item_essence_distiller', // 精之灵器
      'item_ancient_janggo', // 韧鼓
      'item_holy_locket', // 圣洁吊坠
    ],
  },
  // <1k
  {
    level: 1,
    names: [
      'item_bracer', // 护腕
      'item_wraith_band', // 系带
      'item_null_talisman', // 挂件
      'item_infused_raindrop', // 凝魂之露
      'item_magic_wand', // 魔棒
      'item_bottle', // 魔瓶
    ],
  },
];
