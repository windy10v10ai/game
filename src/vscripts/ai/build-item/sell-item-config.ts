/**
 * 出售物品配置
 * 管理AI英雄的出售物品列表
 */

/**
 * 特殊消耗物品列表 - 拥有这些物品时提高出售阈值
 * 这些物品比较重要，需要保留更多的物品栏空间
 */
export const SpecialConsumableItems: string[] = [
  'item_aegis', // 不朽之守护
  'item_tome_of_strength', // 力量书
  'item_tome_of_agility', // 敏捷书
  'item_tome_of_intelligence', // 智力书
  'item_tome_of_luoshu', // 洛书
  'item_wings_of_haste', // 急速之翼
  'item_ultimate_scepter_2', // 真·阿哈利姆神杖
  'item_moon_shard_datadriven', // 真·银月之晶
  'item_ward_observer', // 侦查守卫
  'item_ward_sentry', // 岗哨守卫
];

/**
 * 通用出售物品列表 - 所有英雄都会出售的物品
 * 主要是基础配件和早期物品
 */
export const SellItemCommonList: string[] = [
  // v社更新导致的异常出装
  'item_manta', // 幻影斧
  'item_sphere', // 林肯法球
];

/**
 * 装备升级替代关系配置
 * 当拥有高级装备时，自动出售低级装备
 * 格式: { 高级装备名称: [低级装备名称数组] }
 */
export const ItemUpgradeReplacements: Record<string, string[]> = {
  // 黄金大核荣耀 > 大核荣耀暴虐, 大核荣耀冷酷 > 蝴蝶
  item_wasp_golden: ['item_wasp_despotic', 'item_wasp_callous', 'item_butterfly'],
  item_wasp_despotic: ['item_butterfly'],
  item_wasp_callous: ['item_butterfly'],

  // 跳跳跳刀 > 各种跳刀
  item_jump_jump_jump: [
    'item_blink_dagger',
    'item_swift_blink',
    'item_overwhelming_blink',
    'item_arcane_blink',
    'item_swift_blink_2',
    'item_overwhelming_blink_2',
    'item_arcane_blink_2',
  ],

  // 各种二级跳刀 > 一级跳刀和普通跳刀
  item_swift_blink_2: ['item_swift_blink', 'item_blink_dagger'],
  item_overwhelming_blink_2: ['item_overwhelming_blink', 'item_blink_dagger'],
  item_arcane_blink: ['item_arcane_blink_2', 'item_blink_dagger'], // 大智力跳 对调了

  // 一级跳刀 > 普通跳刀
  item_swift_blink: ['item_blink_dagger'],
  item_overwhelming_blink: ['item_blink_dagger'],
  item_arcane_blink_2: ['item_blink_dagger'], // 小智力跳

  // 熔火核心 > 刷新球, 奥术之心 > 玲珑心, 以太透镜2 > 以太透镜
  item_refresh_core: [
    'item_refresher',
    'item_octarine_core',
    'item_aether_lens_2',
    'item_arcane_octarine_core',
  ],
  item_aether_lens_2: ['item_aether_lens'],
  item_arcane_octarine_core: ['item_octarine_core', 'item_aether_lens_2'],

  // 刃甲系列 - item_blade_mail_2 > item_blade_mail
  item_blade_mail_2: ['item_blade_mail'],

  // 辉耀系列 - item_radiance_2 > item_radiance
  item_radiance_2: ['item_radiance'],

  // 强袭祭品 - item_vladmir_2 > item_vladmir
  item_vladmir_2: ['item_vladmir', 'item_assault'],

  // 圣女白莲 > 林肯法球, 清莲宝珠
  item_saint_orb: ['item_lotus_orb', 'item_sphere', 'item_sphere_2'],
  item_sphere_2: ['item_sphere'],

  // 推推棒系列 - item_force_staff_3 > item_force_staff_2 > item_force_staff
  item_force_staff_3: ['item_force_staff_2', 'item_force_staff'],
  item_force_staff_2: ['item_force_staff'],

  // 圣剑系列 - item_rapier_ultra_bot > item_rapier_ultra > item_excalibur > item_rapier
  item_rapier_ultra_bot: ['item_rapier_ultra', 'item_excalibur', 'item_rapier'],
  item_rapier_ultra: ['item_excalibur', 'item_rapier'],
  item_excalibur: ['item_rapier', 'item_monkey_king_bar_2'],

  // 金箍棒系列 - item_monkey_king_bar_2 > item_monkey_king_bar
  item_monkey_king_bar_2: ['item_monkey_king_bar'],

  // 冰眼系列 - item_skadi_2 > item_skadi
  item_skadi_2: ['item_skadi'],

  // 幻影斧系列 - item_manta_2 > item_manta_1 > item_manta
  item_manta_2: ['item_manta_1', 'item_manta'],
  item_manta_1: ['item_manta'],

  // 影刀系列 - item_silver_edge_2 > item_silver_edge
  item_silver_edge_2: ['item_silver_edge'],

  // 黑皇杖系列 - item_black_king_bar_2 > item_black_king_bar
  item_black_king_bar_2: ['item_black_king_bar'],

  // 暗灭系列 - item_infernal_desolator > item_dodo_desolator > item_desolator
  item_infernal_desolator: ['item_dodo_desolator', 'item_desolator'],
  item_dodo_desolator: ['item_desolator'],

  // 六脉神剑 > 三叉戟
  item_sacred_six_vein: [
    'item_sacred_trident',
    'item_sange_and_yasha',
    'item_kaya_and_sange',
    'item_yasha_and_kaya',
    'item_yasha',
    'item_sange',
    'item_kaya',
  ],
  item_sacred_trident: [
    'item_sange_and_yasha',
    'item_kaya_and_sange',
    'item_yasha_and_kaya',
    'item_yasha',
    'item_sange',
    'item_kaya',
  ],

  // 深渊之刃系列 - item_abyssal_blade_v2 > item_abyssal_blade
  item_abyssal_blade_v2: ['item_abyssal_blade'],

  // 天堂之戟系列 - item_heavens_halberd_v2 > item_heavens_halberd
  item_heavens_halberd_v2: ['item_heavens_halberd'],

  // 阿迪王系列 - item_adi_king_plus > item_adi_king
  item_adi_king_plus: ['item_adi_king', 'item_phase_boots'],
  item_adi_king: ['item_phase_boots'],

  // 飓风长戟系列 - item_hurricane_pike_2 > item_hurricane_pike
  item_hurricane_pike_2: ['item_hurricane_pike'],

  // 回音刀系列 - item_echo_sabre_2 > item_echo_sabre
  item_echo_sabre_2: ['item_echo_sabre'],

  // 希瓦的守护系列 - item_shivas_guard_2 > item_shivas_guard
  item_shivas_guard_2: ['item_shivas_guard'],

  // 纷争面纱系列 - item_veil_of_discord_2 > item_veil_of_discord
  item_veil_of_discord_2: ['item_veil_of_discord'],

  // 散弹枪系列 - item_shotgun_v2 > item_shotgun
  item_shotgun_v2: ['item_shotgun'],

  // 风暴之锤系列 - item_gungir_2 > item_gungir
  item_gungir_2: ['item_gungir'],

  // 撒旦系列 - item_satanic_2 > item_satanic
  item_satanic_2: ['item_satanic'],

  // 狂战斧系列 - item_bfury_ultra > item_bfury_2 > item_bfury
  item_bfury_ultra: ['item_bfury_2', 'item_bfury'],
  item_bfury_2: ['item_bfury'],

  // 臂章系列 - item_armlet_pro_max > item_armlet_plus > item_armlet
  item_armlet_pro_max: ['item_armlet_plus', 'item_armlet'],
  item_armlet_plus: ['item_armlet'],

  // 点金手系列 - item_hand_of_group > item_hand_of_midas
  item_hand_of_group: ['item_hand_of_midas'],

  // 血精石系列 大小对调
  item_bloodstone: ['item_bloodstone_v2'],

  // 神圣斧系列 - item_devastator_2 > item_devastator
  item_devastator_2: ['item_devastator'],

  // 不朽之心
  item_undying_heart: ['item_heart'],

  // 魔法权杖系列 - item_hallowed_scepter > item_magic_scepter > item_kaya
  item_hallowed_scepter: ['item_magic_scepter', 'item_kaya'],
  item_magic_scepter: ['item_kaya'],

  // 永恒坠饰 > 永恒之盘
  item_aeon_pendant: ['item_aeon_disk'],

  // 死灵法师权杖 > 羊刀
  item_necronomicon_staff: ['item_sheepstick'],
};

/**
 * 英雄特定出售物品列表
 * 根据英雄名称配置特定的出售物品
 */
export const SellItemHeroList: Record<string, string[]> = {
  npc_dota_hero_abaddon: ['item_overwhelming_blink', 'item_echo_sabre_2'],
};
