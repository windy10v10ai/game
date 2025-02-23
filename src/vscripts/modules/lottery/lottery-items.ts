import { Tier } from './tier';

/**
 * 物品抽选概率，Tier 5-1
 * 确保概率从低到高排列
 */
export const itemTiers: Tier[] = [
  {
    level: 5,
    rate: 1,
    names: [
      'item_light_part', // 圣光组件
      'item_dark_part', // 暗影组件

      // ---- 中立物品 lv5 ----
      'item_fallen_sky', // 天崩
      'item_ex_machina', // 机械之心
      'item_desolator_2', // 寂灭
      'item_ballista', // 弩炮
      'item_mirror_shield', // 神镜盾
      'item_force_field', // 秘术师铠甲
      'item_giants_ring', // 巨人戒
      'item_unwavering_condition', // 坚毅之件
      'item_panic_button', // 神妙明灯
      'item_nemesis_curse', // 天诛之咒
      'item_havoc_hammer', // 浩劫巨锤
      'item_specialists_array', // 行家阵列
    ],
  },
  {
    level: 4,
    rate: 5,
    names: [
      // ---- 中立物品 lv4 ----
      'item_force_boots', // 原力鞋
      'item_seer_stone', // 先哲石
      'item_woodland_striders', // 丛林鞋
      'item_mind_breaker', // 智灭
      'item_ascetic_cap', // 简朴短帽
      'item_avianas_feather', // 艾维娜之羽
      'item_ninja_gear', // 忍者用具
      'item_spy_gadget', // 望远镜
      'item_trickster_cloak', // 欺诈师斗篷
      'item_book_of_shadows', // 暗影邪典
      'item_spider_legs', // 网虫腿

      // 未加入中立的物品
      'item_heavy_blade', // 行巫之祸
      'item_minotaur_horn', // 恶牛角
      'item_penta_edged_sword', // 五锋长剑
      'item_vengeances_shadow', // 复仇之影
    ],
  },
  {
    level: 3,
    rate: 20,
    names: [
      'item_tome_of_knowledge', // 知识之书

      // ---- 中立物品 lv4 ----
      'item_martyrs_plate', // 烈士鳞甲

      // ---- 中立物品 lv3 ----
      'item_vindicators_axe', // 正义之斧
      'item_enchanted_quiver', // 魔力箭袋
      'item_the_leveller', // 平世剑
      'item_cloak_of_flames', // 火焰斗篷
      'item_ceremonial_robe', // 祭礼长袍
      'item_psychic_headband', // 通灵头带
      'item_ogre_seal_totem', // 食人魔海豹图腾
      'item_ancient_guardian', // 遗迹守护者

      'item_pirate_hat', // 海盗帽
      // 未加入中立的物品
      'item_third_eye', // 第三只眼
      'item_princes_knife', // 亲王短刀
    ],
  },
  {
    level: 2,
    rate: 60,
    names: [
      'item_aghanims_shard', // 阿哈利姆魔晶

      // ---- 中立物品 lv3 ----
      'item_dandelion_amulet', // 蒲公英护符
      'item_craggy_coat', // 崎岖外衣
      'item_repair_kit', // 维修器具

      // ---- 中立物品 lv2 ----
      'item_orb_of_destruction', // 毁灭灵球
      'item_grove_bow', // 林野长弓
      'item_vambrace', // 臂甲
      'item_defiant_shell', // 不羁甲壳
      'item_duelist_gloves', // 决斗家手套
      'item_whisper_of_the_dread', // 邪道私语

      // ---- 中立物品 lv1 ----
      // 未加入中立的物品
      'item_quickening_charm', // 加速护符
      'item_horizon', // 视界
      'item_imp_claw', // 魔童之爪
      'item_misericorde', // 飞贼之刃
      'item_quicksilver_amulet', // 银闪护符
      // 'item_paintball', // 仙灵榴弹
      // 'item_dagger_of_ristul', // 瑞斯图尔尖匕
      'item_greater_faerie_fire', // 高级仙林之火
      'item_helm_of_the_undying', // 不朽头盔
    ],
  },
  {
    level: 1,
    rate: 100,
    names: [
      'item_bracer', // 护腕
      'item_wraith_band', // 系带
      'item_null_talisman', // 挂件

      // ---- 中立物品 lv2 ----
      'item_dragon_scale', // 炎龙之鳞
      'item_bullwhip', // 凌厉长鞭
      'item_eye_of_the_vizier', // 维齐尔之眼
      'item_gossamer_cape', // 蛛丝斗篷
      'item_light_collector', // 集光器

      // ---- 中立物品 lv1 ----
      'item_safety_bubble', // 安全泡泡
      'item_royal_jelly', // 蜂王浆
      'item_spark_of_courage', // 勇气之光
      'item_seeds_of_serenity', // 宁静种籽
      'item_lance_of_pursuit', // 追击矛
      'item_occult_bracelet', // 玄奥手镯

      // 未加入中立的物品
      'item_essence_ring', // 精华指环
      'item_chipped_vest', // 碎裂背心
      'item_ironwood_tree', // 铁树之木
      'item_iron_talon', // 打野爪
      'item_ring_of_aquila', // 天鹰戒
      'item_poor_mans_shield', // 穷鬼盾
      'item_broom_handle', // 扫帚柄
    ],
  },
];
