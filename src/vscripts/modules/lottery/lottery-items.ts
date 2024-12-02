import { Tier } from './tier';

/**
 * 物品抽选概率，Tier 5-1
 * 确保概率从低到高排列
 */
export const itemTiers: Tier[] = [
  {
    level: 5,
    rate: 0.5,
    names: [
      'item_tome_of_agility', // 敏捷之书
      'item_tome_of_intelligence', // 智力之书
      'item_tome_of_strength', // 力量之书

      // ---- 中立物品 lv5 ----
      'item_fallen_sky', // 天崩
      'item_desolator_2', // 寂灭
      'item_mirror_shield', // 神镜盾
      'item_ballista', // 弩炮
      'item_seer_stone', // 先哲石
      'item_ex_machina', // 机械之心
      'item_pirate_hat', // 海盗帽
    ],
  },
  {
    level: 4,
    rate: 2,
    names: [
      'item_light_part', // 圣光组件
      'item_dark_part', // 暗影组件

      // ---- 中立物品 lv4 ----
      'item_penta_edged_sword', // 五锋长剑
      'item_panic_button', // 神灯
      'item_minotaur_horn', // 恶牛角
      'item_spell_prism', // 法术棱镜
      'item_helm_of_the_undying', // 不死头盔
      'item_woodland_striders', // 丛林鞋
      'item_princes_knife', // 亲王短刀
      'item_repair_kit', // 维修器具
    ],
  },
  {
    level: 3,
    rate: 15,
    names: [
      // ---- 中立物品 lv3 ----
      'item_titan_sliver', // 巨神残铁
      'item_quickening_charm', // 加速护符
      'item_spider_legs', // 网虫腿
      'item_horizon', // 视界
      'item_witless_shako', // 无知小帽
      'item_third_eye', // 第三只眼
      'item_the_leveller', // 平世剑
      'item_paladin_sword', // 骑士剑
    ],
  },
  {
    level: 2,
    rate: 50,
    names: [
      'item_hand_of_midas', // 点金手
      'item_holy_locket', // 圣洁吊坠
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_great_famango', // 大疗伤莲花
      'item_tome_of_knowledge', // 知识之书

      // ---- 中立物品 lv2 ----
      'item_imp_claw', // 魔童之爪
      'item_vampire_fangs', // 吸血鬼獠牙
      'item_mysterious_hat', // 仙灵饰品
      'item_vambrace', // 臂甲
      'item_grove_bow', // 林野长弓
      'item_orb_of_destruction', // 毁灭灵球
      'item_philosophers_stone', // 贤者石
      'item_essence_ring', // 精华指环
    ],
  },
  {
    level: 1,
    rate: 100,
    names: [
      'item_bottle', // 魔瓶
      'item_bracer', // 护腕
      'item_wraith_band', // 系带
      'item_null_talisman', // 挂件
      'item_infused_raindrop', // 凝魂之露

      // ---- 中立物品 lv1 ----
      'item_chipped_vest', // 碎裂背心
      'item_ironwood_tree', // 铁树之木
      'item_iron_talon', // 打野爪
      'item_keen_optic', // 基恩镜片
      'item_possessed_mask', // 附魂面具
      'item_ring_of_aquila', // 天鹰戒
      'item_poor_mans_shield', // 穷鬼盾
      'item_broom_handle', // 扫帚柄
    ],
  },
];
