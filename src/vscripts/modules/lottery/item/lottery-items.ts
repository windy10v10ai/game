import { Tier } from '../shared/tier';

/**
 * 物品抽奖池，Tier 5-1。配合 ITEM_TIER_RATES [1,5,20,60,100] 累计阈值使用。
 * 单格出现概率：T5 1% / T4 4% / T3 15% / T2 40% / T1 40%
 */
export const itemTiers: Tier[] = [
  {
    level: 5,
    names: [
      'item_fusion_rune', // 融合符文
      'item_tome_of_agility', // 敏捷之书
      'item_tome_of_intelligence', // 智力之书
      'item_tome_of_strength', // 力量之书
    ],
  },
  {
    level: 4,
    names: [
      'item_light_part', // 圣光组件
      'item_dark_part', // 暗影组件
      'item_hand_of_midas', // 点金手
      'item_holy_locket', // 圣洁吊坠
    ],
  },
  {
    level: 3,
    names: [
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_great_famango', // 大疗伤莲花
      'item_aether_lens', // 以太之镜
      'item_glimmer_cape', // 微光披风
      'item_force_staff', // 原力法杖
    ],
  },
  {
    level: 2,
    names: [
      'item_tome_of_knowledge', // 知识之书
      'item_bottle', // 魔瓶
      'item_magic_wand', // 魔棒
      'item_arcane_boots', // 秘法鞋
      'item_phase_boots', // 相位鞋
      'item_power_treads', // 动力鞋
      'item_tranquil_boots', // 净魂之刃
    ],
  },
  {
    level: 1,
    names: [
      'item_bracer', // 护腕
      'item_wraith_band', // 系带
      'item_null_talisman', // 挂件
      'item_infused_raindrop', // 凝魂之露
      'item_magic_stick', // 魔杖
    ],
  },
];
