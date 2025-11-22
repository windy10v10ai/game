/**
 * 装备等级配置
 * 基于实际装备金钱划分为5个等级
 */

/**
 * 装备等级枚举
 * 基于实际金钱划分:
 * T1: <2000金 - 早期装备
 * T2: 2000-5000金 - 中期过渡
 * T3: 5000-10000金 - 中期核心
 * T4: 10000-30000金 - 后期装备
 * T5: >30000金 - 终极装备
 */
export enum ItemTier {
  T1 = 1,
  T2 = 2,
  T3 = 3,
  T4 = 4,
  T5 = 5,
}

/**
 * 装备配置接口
 */
export interface ItemConfig {
  /** 装备名称 */
  name: string;
  /** 装备等级 */
  tier: ItemTier;
  /** 实际金钱(用于验证) */
  cost: number;
  /** 直接前置装备（下位装备，只有一条路线） */
  prerequisite?: string;
  /** 可升级到的装备列表（上位装备，支持多种路线） */
  upgrades?: string[];
}

/**
 * 所有装备的等级配置
 * 基于 -itemcost 命令输出的实际金钱数据
 */
export const ItemTierConfig: Record<string, ItemConfig> = {
  // ===== T1: 早期装备 (<2000金) =====

  // 基础装备
  item_boots: {
    name: 'item_boots',
    tier: ItemTier.T1,
    cost: 500,
    upgrades: ['item_power_treads', 'item_phase_boots', 'item_arcane_boots', 'item_tranquil_boots'],
  },
  item_magic_wand: {
    name: 'item_magic_wand',
    tier: ItemTier.T1,
    cost: 450,
    upgrades: ['item_holy_locket'],
  },
  item_bracer: { name: 'item_bracer', tier: ItemTier.T1, cost: 500 },
  item_null_talisman: {
    name: 'item_null_talisman',
    tier: ItemTier.T1,
    cost: 500,
  },
  item_wraith_band: {
    name: 'item_wraith_band',
    tier: ItemTier.T1,
    cost: 500,
  },
  item_quelling_blade_2_datadriven: {
    name: 'item_quelling_blade_2_datadriven',
    tier: ItemTier.T1,
    cost: 600,
  },

  // 消耗品
  item_blood_grenade: {
    name: 'item_blood_grenade',
    tier: ItemTier.T1,
    cost: 100,
  },
  item_clarity: {
    name: 'item_clarity',
    tier: ItemTier.T1,
    cost: 50,
  },
  item_tango: {
    name: 'item_tango',
    tier: ItemTier.T1,
    cost: 120,
  },
  item_flask: {
    name: 'item_flask',
    tier: ItemTier.T1,
    cost: 110,
  },
  item_enchanted_mango: {
    name: 'item_enchanted_mango',
    tier: ItemTier.T1,
    cost: 260,
  },
  item_faerie_fire: {
    name: 'item_faerie_fire',
    tier: ItemTier.T1,
    cost: 260,
  },
  item_infused_raindrop: {
    name: 'item_infused_raindrop',
    tier: ItemTier.T1,
    cost: 675,
  },

  // 早期功能装备
  item_soul_ring: { name: 'item_soul_ring', tier: ItemTier.T1, cost: 805 },
  item_tranquil_boots: {
    name: 'item_tranquil_boots',
    tier: ItemTier.T1,
    cost: 900,
  },
  item_orb_of_corrosion: {
    name: 'item_orb_of_corrosion',
    tier: ItemTier.T1,
    cost: 1050,
  },
  item_falcon_blade: {
    name: 'item_falcon_blade',
    tier: ItemTier.T1,
    cost: 1125,
  },

  // T1鞋子
  item_power_treads: {
    name: 'item_power_treads',
    tier: ItemTier.T1,
    cost: 1400,
    upgrades: ['item_phase_boots'],
  },
  item_arcane_boots: {
    name: 'item_arcane_boots',
    tier: ItemTier.T1,
    cost: 1400,
  },
  item_phase_boots: {
    name: 'item_phase_boots',
    tier: ItemTier.T1,
    cost: 1500,
    upgrades: ['item_adi_king', 'item_adi_king_plus'],
  },

  // 早期防御/核心
  item_vanguard: { name: 'item_vanguard', tier: ItemTier.T1, cost: 1700 },
  item_mask_of_madness: {
    name: 'item_mask_of_madness',
    tier: ItemTier.T1,
    cost: 1900,
  },

  // ===== T2: 中期过渡 (2000-5000金) =====

  // 三系列基础
  item_kaya: {
    name: 'item_kaya',
    tier: ItemTier.T2,
    cost: 2100,
    upgrades: ['item_kaya_and_sange', 'item_yasha_and_kaya', 'item_sacred_trident'],
  },
  item_sange: {
    name: 'item_sange',
    tier: ItemTier.T2,
    cost: 2100,
    upgrades: ['item_sange_and_yasha', 'item_kaya_and_sange', 'item_sacred_trident'],
  },
  item_yasha: {
    name: 'item_yasha',
    tier: ItemTier.T2,
    cost: 2100,
    upgrades: ['item_sange_and_yasha', 'item_yasha_and_kaya', 'item_sacred_trident'],
  },

  // 功能装备
  item_glimmer_cape: {
    name: 'item_glimmer_cape',
    tier: ItemTier.T2,
    cost: 2150,
  },
  item_vladmir: {
    name: 'item_vladmir',
    tier: ItemTier.T2,
    cost: 2200,
    upgrades: ['item_vladmir_2'],
  },
  item_force_staff: {
    name: 'item_force_staff',
    tier: ItemTier.T2,
    cost: 2200,
    upgrades: ['item_force_staff_2', 'item_force_staff_3'],
  },
  item_hand_of_midas: {
    name: 'item_hand_of_midas',
    tier: ItemTier.T2,
    cost: 2200,
    upgrades: ['item_hand_of_group'],
  },
  item_holy_locket: {
    name: 'item_holy_locket',
    tier: ItemTier.T2,
    cost: 2250,
    upgrades: ['item_orb_of_the_brine'],
  },
  item_blink: {
    name: 'item_blink',
    tier: ItemTier.T2,
    cost: 2250,
    upgrades: [
      'item_swift_blink',
      'item_overwhelming_blink',
      'item_arcane_blink_2',
      'item_jump_jump_jump',
    ],
  },
  item_rod_of_atos: {
    name: 'item_rod_of_atos',
    tier: ItemTier.T2,
    cost: 2250,
  },

  // 防御/核心装备
  item_blade_mail: {
    name: 'item_blade_mail',
    tier: ItemTier.T2,
    cost: 2300,
    upgrades: ['item_blade_mail_2'],
  },
  item_aether_lens: {
    name: 'item_aether_lens',
    tier: ItemTier.T2,
    cost: 2350,
    upgrades: ['item_aether_lens_2'],
  },
  item_armlet: {
    name: 'item_armlet',
    tier: ItemTier.T2,
    cost: 2500,
    upgrades: ['item_armlet_plus', 'item_armlet_pro_max'],
  },
  item_travel_boots: {
    name: 'item_travel_boots',
    tier: ItemTier.T2,
    cost: 2500,
  },
  item_heavens_halberd: {
    name: 'item_heavens_halberd',
    tier: ItemTier.T2,
    cost: 2600,
    upgrades: ['item_heavens_halberd_v2'],
  },
  item_echo_sabre: {
    name: 'item_echo_sabre',
    tier: ItemTier.T2,
    cost: 2700,
    upgrades: ['item_echo_sabre_2'],
  },
  item_basher: {
    name: 'item_basher',
    tier: ItemTier.T2,
    cost: 2875,
    upgrades: ['item_abyssal_blade', 'item_abyssal_blade_v2'],
  },

  // 高价T2装备
  item_aeon_disk: {
    name: 'item_aeon_disk',
    tier: ItemTier.T2,
    cost: 3000,
    upgrades: ['item_aeon_pendant'],
  },
  item_aether_lens_2: {
    name: 'item_aether_lens_2',
    tier: ItemTier.T2,
    cost: 3200,
    prerequisite: 'item_aether_lens',
  },
  item_desolator: {
    name: 'item_desolator',
    tier: ItemTier.T2,
    cost: 3500,
    upgrades: ['item_dodo_desolator', 'item_infernal_desolator'],
  },

  // 特殊装备
  item_wings_of_haste: {
    name: 'item_wings_of_haste',
    tier: ItemTier.T2,
    cost: 3700,
  },
  item_eternal_shroud: {
    name: 'item_eternal_shroud',
    tier: ItemTier.T2,
    cost: 3700,
    upgrades: ['item_eternal_shroud_ultra'],
  },
  item_force_staff_2: {
    name: 'item_force_staff_2',
    tier: ItemTier.T2,
    cost: 3700,
    prerequisite: 'item_force_staff',
    upgrades: ['item_force_staff_3'],
  },
  item_pipe: { name: 'item_pipe', tier: ItemTier.T2, cost: 3725 },
  item_lotus_orb: {
    name: 'item_lotus_orb',
    tier: ItemTier.T2,
    cost: 3850,
    upgrades: ['item_saint_orb'],
  },
  item_bfury: {
    name: 'item_bfury',
    tier: ItemTier.T2,
    cost: 3900,
    upgrades: ['item_bfury_ultra'],
  },

  // 核心装备
  item_black_king_bar: {
    name: 'item_black_king_bar',
    tier: ItemTier.T2,
    cost: 4050,
    upgrades: ['item_black_king_bar_2'],
  },
  item_yasha_and_kaya: {
    name: 'item_yasha_and_kaya',
    tier: ItemTier.T2,
    cost: 4200,
    prerequisite: 'item_yasha',
    upgrades: ['item_sacred_trident', 'item_sacred_six_vein'],
  },
  item_ultimate_scepter: {
    name: 'item_ultimate_scepter',
    tier: ItemTier.T2,
    cost: 4200,
    upgrades: ['item_ultimate_scepter_2'],
  },
  item_kaya_and_sange: {
    name: 'item_kaya_and_sange',
    tier: ItemTier.T2,
    cost: 4200,
    prerequisite: 'item_kaya',
    upgrades: ['item_sacred_trident', 'item_sacred_six_vein', 'item_kaya_and_sange_1'],
  },
  item_sange_and_yasha: {
    name: 'item_sange_and_yasha',
    tier: ItemTier.T2,
    cost: 4200,
    prerequisite: 'item_sange',
    upgrades: ['item_sacred_trident', 'item_sacred_six_vein', 'item_sange_and_yasha_1'],
  },
  item_echo_sabre_2: {
    name: 'item_echo_sabre_2',
    tier: ItemTier.T2,
    cost: 4325,
    prerequisite: 'item_echo_sabre',
  },
  item_bloodstone_v2: {
    name: 'item_bloodstone_v2',
    tier: ItemTier.T2,
    cost: 4400,
    upgrades: ['item_bloodstone'],
  },
  item_hurricane_pike: {
    name: 'item_hurricane_pike',
    tier: ItemTier.T2,
    cost: 4450,
    upgrades: ['item_hurricane_pike_2'],
  },
  item_shotgun: {
    name: 'item_shotgun',
    tier: ItemTier.T2,
    cost: 4500,
    upgrades: ['item_shotgun_v2'],
  },
  item_armlet_plus: {
    name: 'item_armlet_plus',
    tier: ItemTier.T2,
    cost: 4500,
    prerequisite: 'item_armlet',
    upgrades: ['item_armlet_pro_max'],
  },
  item_gungir: {
    name: 'item_gungir',
    tier: ItemTier.T2,
    cost: 4550,
    upgrades: ['item_gungir_2'],
  },
  item_manta: {
    name: 'item_manta',
    tier: ItemTier.T2,
    cost: 4650,
    upgrades: ['item_manta_1', 'item_manta_2'],
  },
  item_monkey_king_bar: {
    name: 'item_monkey_king_bar',
    tier: ItemTier.T2,
    cost: 4700,
    upgrades: ['item_monkey_king_bar_2'],
  },
  item_radiance: {
    name: 'item_radiance',
    tier: ItemTier.T2,
    cost: 4700,
    upgrades: ['item_radiance_2'],
  },
  item_sphere: {
    name: 'item_sphere',
    tier: ItemTier.T2,
    cost: 4800,
    upgrades: ['item_sphere_2', 'item_saint_orb'],
  },
  item_hand_of_group: {
    name: 'item_hand_of_group',
    tier: ItemTier.T2,
    cost: 4800,
    prerequisite: 'item_hand_of_midas',
  },
  item_octarine_core: {
    name: 'item_octarine_core',
    tier: ItemTier.T2,
    cost: 4800,
    upgrades: ['item_arcane_octarine_core', 'item_refresh_core'],
  },

  // ===== T3: 中期核心 (5000-10000金) =====

  item_adi_king: {
    name: 'item_adi_king',
    tier: ItemTier.T3,
    cost: 5000,
    prerequisite: 'item_power_treads',
    upgrades: ['item_adi_king_plus'],
  },
  item_refresher: {
    name: 'item_refresher',
    tier: ItemTier.T3,
    cost: 5000,
    upgrades: ['item_refresh_core'],
  },
  item_satanic: {
    name: 'item_satanic',
    tier: ItemTier.T3,
    cost: 5050,
    upgrades: ['item_satanic_2'],
  },
  item_arcane_blink_2: {
    name: 'item_arcane_blink_2',
    tier: ItemTier.T3,
    cost: 5050,
    prerequisite: 'item_blink',
    upgrades: ['item_arcane_blink', 'item_jump_jump_jump'],
  },
  item_guardian_greaves: {
    name: 'item_guardian_greaves',
    tier: ItemTier.T3,
    cost: 5050,
    upgrades: ['item_guardian_greaves_artifact'],
  },
  item_greater_crit: {
    name: 'item_greater_crit',
    tier: ItemTier.T3,
    cost: 5100,
  },
  item_assault: {
    name: 'item_assault',
    tier: ItemTier.T3,
    cost: 5125,
  },
  item_shivas_guard: {
    name: 'item_shivas_guard',
    tier: ItemTier.T3,
    cost: 5175,
    upgrades: ['item_shivas_guard_2'],
  },
  item_sheepstick: {
    name: 'item_sheepstick',
    tier: ItemTier.T3,
    cost: 5200,
    upgrades: ['item_necronomicon_staff'],
  },
  item_heart: {
    name: 'item_heart',
    tier: ItemTier.T3,
    cost: 5200,
    upgrades: ['item_undying_heart'],
  },
  item_force_staff_3: {
    name: 'item_force_staff_3',
    tier: ItemTier.T3,
    cost: 5200,
    prerequisite: 'item_force_staff_2',
  },
  item_swift_blink: {
    name: 'item_swift_blink',
    tier: ItemTier.T3,
    cost: 5300,
    prerequisite: 'item_blink',
    upgrades: ['item_swift_blink_2', 'item_jump_jump_jump'],
  },
  item_overwhelming_blink: {
    name: 'item_overwhelming_blink',
    tier: ItemTier.T3,
    cost: 5300,
    prerequisite: 'item_blink',
    upgrades: ['item_overwhelming_blink_2', 'item_jump_jump_jump'],
  },
  item_silver_edge: {
    name: 'item_silver_edge',
    tier: ItemTier.T3,
    cost: 5350,
    upgrades: ['item_silver_edge_2'],
  },
  item_ethereal_blade: {
    name: 'item_ethereal_blade',
    tier: ItemTier.T3,
    cost: 5450,
    upgrades: ['item_ethereal_blade_ultra'],
  },
  item_butterfly: {
    name: 'item_butterfly',
    tier: ItemTier.T3,
    cost: 5450,
    upgrades: ['item_wasp_callous', 'item_wasp_despotic', 'item_wasp_golden'],
  },
  item_mjollnir: { name: 'item_mjollnir', tier: ItemTier.T3, cost: 5500 },
  item_blade_mail_2: {
    name: 'item_blade_mail_2',
    tier: ItemTier.T3,
    cost: 5600,
    prerequisite: 'item_blade_mail',
  },
  item_rapier: {
    name: 'item_rapier',
    tier: ItemTier.T3,
    cost: 5600,
    upgrades: ['item_excalibur', 'item_rapier_ultra'],
  },
  item_skadi: {
    name: 'item_skadi',
    tier: ItemTier.T3,
    cost: 5900,
    upgrades: ['item_skadi_2'],
  },
  item_radiance_2: {
    name: 'item_radiance_2',
    tier: ItemTier.T3,
    cost: 6000,
    prerequisite: 'item_radiance',
  },
  item_phylactery: {
    name: 'item_phylactery',
    tier: ItemTier.T3,
    cost: 6000,
  },
  item_aeon_pendant: {
    name: 'item_aeon_pendant',
    tier: ItemTier.T3,
    cost: 6000,
    prerequisite: 'item_aeon_disk',
  },
  item_devastator: {
    name: 'item_devastator',
    tier: ItemTier.T3,
    cost: 6200,
    upgrades: ['item_devastator_2'],
  },
  item_abyssal_blade: {
    name: 'item_abyssal_blade',
    tier: ItemTier.T3,
    cost: 6250,
    prerequisite: 'item_basher',
    upgrades: ['item_abyssal_blade_v2'],
  },
  item_armlet_pro_max: {
    name: 'item_armlet_pro_max',
    tier: ItemTier.T3,
    cost: 6500,
    prerequisite: 'item_armlet_plus',
  },
  item_sphere_2: {
    name: 'item_sphere_2',
    tier: ItemTier.T3,
    cost: 6800,
    prerequisite: 'item_sphere',
    upgrades: ['item_saint_orb'],
  },
  item_dagon_5: { name: 'item_dagon_5', tier: ItemTier.T3, cost: 7450 },
  item_sacred_trident: {
    name: 'item_sacred_trident',
    tier: ItemTier.T3,
    cost: 7800,
    prerequisite: 'item_kaya',
    upgrades: ['item_sacred_six_vein'],
  },
  item_manta_1: {
    name: 'item_manta_1',
    tier: ItemTier.T3,
    cost: 8000,
    prerequisite: 'item_manta',
    upgrades: ['item_manta_2'],
  },
  item_orb_of_the_brine: {
    name: 'item_orb_of_the_brine',
    tier: ItemTier.T3,
    cost: 8000,
  },
  item_magic_scepter: {
    name: 'item_magic_scepter',
    tier: ItemTier.T3,
    cost: 8000,
    upgrades: ['item_hallowed_scepter'],
  },
  item_moon_shard_datadriven: {
    name: 'item_moon_shard_datadriven',
    tier: ItemTier.T3,
    cost: 8000,
  },
  item_silver_edge_2: {
    name: 'item_silver_edge_2',
    tier: ItemTier.T3,
    cost: 8350,
    prerequisite: 'item_silver_edge',
  },
  item_dodo_desolator: {
    name: 'item_dodo_desolator',
    tier: ItemTier.T3,
    cost: 8600,
    prerequisite: 'item_desolator',
    upgrades: ['item_infernal_desolator'],
  },
  item_ultimate_scepter_2: {
    name: 'item_ultimate_scepter_2',
    tier: ItemTier.T3,
    cost: 8600,
    prerequisite: 'item_ultimate_scepter',
  },
  item_bloodstone: {
    name: 'item_bloodstone',
    tier: ItemTier.T3,
    cost: 9000,
    prerequisite: 'item_bloodstone_v2',
  },
  item_heavens_halberd_v2: {
    name: 'item_heavens_halberd_v2',
    tier: ItemTier.T3,
    cost: 9500,
    prerequisite: 'item_heavens_halberd',
  },
  item_adi_king_plus: {
    name: 'item_adi_king_plus',
    tier: ItemTier.T3,
    cost: 9600,
    prerequisite: 'item_adi_king',
  },
  item_eternal_shroud_ultra: {
    name: 'item_eternal_shroud_ultra',
    tier: ItemTier.T3,
    cost: 9600,
    prerequisite: 'item_eternal_shroud',
  },
  item_hurricane_pike_2: {
    name: 'item_hurricane_pike_2',
    tier: ItemTier.T3,
    cost: 9700,
    prerequisite: 'item_hurricane_pike',
  },
  item_monkey_king_bar_2: {
    name: 'item_monkey_king_bar_2',
    tier: ItemTier.T3,
    cost: 9800,
    prerequisite: 'item_monkey_king_bar',
  },
  item_angels_demise: {
    name: 'item_angels_demise',
    tier: ItemTier.T3,
    cost: 9800,
  },
  item_vladmir_2: {
    name: 'item_vladmir_2',
    tier: ItemTier.T3,
    cost: 9800,
    prerequisite: 'item_vladmir',
  },

  // ===== T4: 后期装备 (10000-30000金) =====

  item_wasp_callous: {
    name: 'item_wasp_callous',
    tier: ItemTier.T4,
    cost: 10000,
    prerequisite: 'item_butterfly',
    upgrades: ['item_wasp_golden'],
  },
  item_shotgun_v2: {
    name: 'item_shotgun_v2',
    tier: ItemTier.T4,
    cost: 10000,
    prerequisite: 'item_shotgun',
  },
  item_wasp_despotic: {
    name: 'item_wasp_despotic',
    tier: ItemTier.T4,
    cost: 10000,
    prerequisite: 'item_butterfly',
    upgrades: ['item_wasp_golden'],
  },
  item_arcane_blink: {
    name: 'item_arcane_blink',
    tier: ItemTier.T4,
    cost: 10100,
    prerequisite: 'item_arcane_blink_2',
    upgrades: ['item_jump_jump_jump'],
  },
  item_overwhelming_blink_2: {
    name: 'item_overwhelming_blink_2',
    tier: ItemTier.T4,
    cost: 10600,
    prerequisite: 'item_overwhelming_blink',
    upgrades: ['item_jump_jump_jump'],
  },
  item_arcane_octarine_core: {
    name: 'item_arcane_octarine_core',
    tier: ItemTier.T4,
    cost: 10600,
    prerequisite: 'item_octarine_core',
  },
  item_swift_blink_2: {
    name: 'item_swift_blink_2',
    tier: ItemTier.T4,
    cost: 10600,
    prerequisite: 'item_swift_blink',
    upgrades: ['item_jump_jump_jump'],
  },
  item_insight_armor: {
    name: 'item_insight_armor',
    tier: ItemTier.T4,
    cost: 10800,
  },
  item_abyssal_blade_v2: {
    name: 'item_abyssal_blade_v2',
    tier: ItemTier.T4,
    cost: 10800,
    prerequisite: 'item_abyssal_blade',
  },
  item_saint_orb: {
    name: 'item_saint_orb',
    tier: ItemTier.T4,
    cost: 11000,
    prerequisite: 'item_lotus_orb',
  },
  item_manta_2: {
    name: 'item_manta_2',
    tier: ItemTier.T4,
    cost: 11100,
    prerequisite: 'item_manta_1',
  },
  item_black_king_bar_2: {
    name: 'item_black_king_bar_2',
    tier: ItemTier.T4,
    cost: 11600,
    prerequisite: 'item_black_king_bar',
  },
  item_ethereal_blade_ultra: {
    name: 'item_ethereal_blade_ultra',
    tier: ItemTier.T4,
    cost: 12000,
    prerequisite: 'item_ethereal_blade',
  },
  item_skadi_2: {
    name: 'item_skadi_2',
    tier: ItemTier.T4,
    cost: 12000,
    prerequisite: 'item_skadi',
  },
  item_satanic_2: {
    name: 'item_satanic_2',
    tier: ItemTier.T4,
    cost: 12000,
    prerequisite: 'item_satanic',
  },
  item_bfury_ultra: {
    name: 'item_bfury_ultra',
    tier: ItemTier.T4,
    cost: 12000,
    prerequisite: 'item_bfury',
  },
  item_devastator_2: {
    name: 'item_devastator_2',
    tier: ItemTier.T4,
    cost: 12600,
    prerequisite: 'item_devastator',
  },
  item_undying_heart: {
    name: 'item_undying_heart',
    tier: ItemTier.T4,
    cost: 13800,
    prerequisite: 'item_heart',
  },
  item_shivas_guard_2: {
    name: 'item_shivas_guard_2',
    tier: ItemTier.T4,
    cost: 14000,
    prerequisite: 'item_shivas_guard',
  },
  item_kaya_and_sange_1: {
    name: 'item_kaya_and_sange_1',
    tier: ItemTier.T4,
    cost: 14000,
    prerequisite: 'item_kaya_and_sange',
  },
  item_sange_and_yasha_1: {
    name: 'item_sange_and_yasha_1',
    tier: ItemTier.T4,
    cost: 14000,
    prerequisite: 'item_sange_and_yasha',
  },
  item_gungir_2: {
    name: 'item_gungir_2',
    tier: ItemTier.T4,
    cost: 15000,
    prerequisite: 'item_gungir',
  },
  item_infernal_desolator: {
    name: 'item_infernal_desolator',
    tier: ItemTier.T4,
    cost: 15600,
    prerequisite: 'item_dodo_desolator',
  },
  item_sacred_six_vein: {
    name: 'item_sacred_six_vein',
    tier: ItemTier.T4,
    cost: 15600,
    prerequisite: 'item_sacred_trident',
  },
  item_jump_jump_jump: {
    name: 'item_jump_jump_jump',
    tier: ItemTier.T4,
    cost: 15650,
    prerequisite: 'item_overwhelming_blink_2',
    // 可以有多个前置：overwhelming_blink_2, arcane_blink, swift_blink_2，选择其中一个作为主要前置
  },
  item_necronomicon_staff: {
    name: 'item_necronomicon_staff',
    tier: ItemTier.T4,
    cost: 16000,
    prerequisite: 'item_sheepstick',
  },
  item_force_field_ultra: {
    name: 'item_force_field_ultra',
    tier: ItemTier.T4,
    cost: 16600,
  },
  item_blue_fantasy: {
    name: 'item_blue_fantasy',
    tier: ItemTier.T4,
    cost: 16745,
  },
  item_hallowed_scepter: {
    name: 'item_hallowed_scepter',
    tier: ItemTier.T4,
    cost: 16800,
    prerequisite: 'item_magic_scepter',
  },
  item_refresh_core: {
    name: 'item_refresh_core',
    tier: ItemTier.T4,
    cost: 19800,
    prerequisite: 'item_refresher',
  },
  item_guardian_greaves_artifact: {
    name: 'item_guardian_greaves_artifact',
    tier: ItemTier.T4,
    cost: 19900,
    prerequisite: 'item_guardian_greaves',
  },
  item_tome_of_agility: {
    name: 'item_tome_of_agility',
    tier: ItemTier.T4,
    cost: 19999,
  },
  item_tome_of_intelligence: {
    name: 'item_tome_of_intelligence',
    tier: ItemTier.T4,
    cost: 19999,
  },
  item_tome_of_strength: {
    name: 'item_tome_of_strength',
    tier: ItemTier.T4,
    cost: 19999,
  },
  item_wasp_golden: {
    name: 'item_wasp_golden',
    tier: ItemTier.T4,
    cost: 20000,
    prerequisite: 'item_wasp_callous',
  },
  item_excalibur: {
    name: 'item_excalibur',
    tier: ItemTier.T4,
    cost: 29800,
    prerequisite: 'item_rapier',
    upgrades: ['item_rapier_ultra'],
  },

  // ===== T5: 终极装备 (>30000金) =====

  item_rapier_ultra: {
    name: 'item_rapier_ultra',
    tier: ItemTier.T5,
    cost: 44000,
    prerequisite: 'item_excalibur',
    upgrades: ['item_rapier_ultra_bot'],
  },
  item_hawkeye_fighter: {
    name: 'item_hawkeye_fighter',
    tier: ItemTier.T5,
    cost: 56349,
  },
  item_dracula_mask: {
    name: 'item_dracula_mask',
    tier: ItemTier.T5,
    cost: 57449,
  },
  item_forbidden_staff: {
    name: 'item_forbidden_staff',
    tier: ItemTier.T5,
    cost: 58449,
  },
  item_rapier_ultra_bot: {
    name: 'item_rapier_ultra_bot',
    tier: ItemTier.T5,
    cost: 60000,
    prerequisite: 'item_rapier_ultra',
    upgrades: ['item_rapier_ultra_bot_1'],
  },
  item_tome_of_luoshu: {
    name: 'item_tome_of_luoshu',
    tier: ItemTier.T5,
    cost: 60000,
  },
  item_rapier_ultra_bot_1: {
    name: 'item_rapier_ultra_bot_1',
    tier: ItemTier.T5,
    cost: 60000,
    prerequisite: 'item_rapier_ultra_bot',
  },
  item_swift_glove: {
    name: 'item_swift_glove',
    tier: ItemTier.T5,
    cost: 60099,
  },
  item_forbidden_blade: {
    name: 'item_forbidden_blade',
    tier: ItemTier.T5,
    cost: 62544,
  },
  item_shadow_impact: {
    name: 'item_shadow_impact',
    tier: ItemTier.T5,
    cost: 65249,
  },
  item_hawkeye_turret: {
    name: 'item_hawkeye_turret',
    tier: ItemTier.T5,
    cost: 65299,
  },
  item_withered_spring: {
    name: 'item_withered_spring',
    tier: ItemTier.T5,
    cost: 65649,
  },
  item_magic_crit_blade: {
    name: 'item_magic_crit_blade',
    tier: ItemTier.T5,
    cost: 65999,
  },
  item_beast_armor: {
    name: 'item_beast_armor',
    tier: ItemTier.T5,
    cost: 66599,
  },
  item_magic_sword: {
    name: 'item_magic_sword',
    tier: ItemTier.T5,
    cost: 69599,
  },
  item_beast_shield: {
    name: 'item_beast_shield',
    tier: ItemTier.T5,
    cost: 71799,
  },
  item_time_gem: {
    name: 'item_time_gem',
    tier: ItemTier.T5,
    cost: 77799,
  },
  item_switchable_crit_blade: {
    name: 'item_switchable_crit_blade',
    tier: ItemTier.T5,
    cost: 79799,
  },
  item_ten_thousand_swords: {
    name: 'item_ten_thousand_swords',
    tier: ItemTier.T5,
    cost: 87599,
  },
};

/**
 * 根据装备名称获取装备配置
 */
export function getItemConfig(itemName: string): ItemConfig | undefined {
  return ItemTierConfig[itemName];
}

/**
 * 根据装备名称获取装备等级
 */
export function getItemTier(itemName: string): ItemTier | undefined {
  return ItemTierConfig[itemName]?.tier;
}

/**
 * 初始化所有装备的 upgrades 字段（递归查找所有升级装备）
 * 基于直接升级关系递归查找所有间接升级装备，填充到 upgrades 中
 */
export function InitializeItemUpgrades(): void {
  print('[AI] InitializeItemUpgrades 初始化装备升级关系');
  // 遍历所有装备
  for (const itemName in ItemTierConfig) {
    const config = ItemTierConfig[itemName];
    if (!config) continue;

    // 如果该装备没有直接升级，跳过
    if (!config.upgrades || config.upgrades.length === 0) {
      continue;
    }

    // 递归查找所有升级装备（包括间接升级）
    const allUpgrades = new Set<string>(config.upgrades);
    const visited = new Set<string>();

    function collectAllUpgrades(item: string) {
      if (visited.has(item)) return;
      visited.add(item);

      const itemConfig = ItemTierConfig[item];
      if (!itemConfig || !itemConfig.upgrades) return;

      for (const upgrade of itemConfig.upgrades) {
        if (!allUpgrades.has(upgrade)) {
          allUpgrades.add(upgrade);
          collectAllUpgrades(upgrade);
        }
      }
    }

    // 对每个直接升级装备，递归查找其所有升级装备
    for (const directUpgrade of config.upgrades) {
      collectAllUpgrades(directUpgrade);
    }

    // 将递归查找的结果更新到 config.upgrades
    config.upgrades = Array.from(allUpgrades);
  }
}

/**
 * 获取装备的所有前置装备（下位装备）
 * 基于 prerequisite 字段递归查找
 * @param itemName 装备名称
 * @returns 前置装备列表（从最底层到当前装备的前一个）
 */
export function GetItemPrerequisites(itemName: string): string[] {
  const config = ItemTierConfig[itemName];
  if (!config || !config.prerequisite) {
    return [];
  }

  const prerequisites: string[] = [];
  let currentItem: string | undefined = config.prerequisite;

  // 递归查找所有前置装备
  while (currentItem) {
    const currentConfig = ItemTierConfig[currentItem];
    if (!currentConfig) break;

    prerequisites.push(currentItem);
    currentItem = currentConfig.prerequisite;
  }

  return prerequisites;
}

/**
 * 获取装备的升级装备链
 * 直接返回初始化时填充的 upgrades 字段
 * @param itemName 装备名称
 * @returns 升级装备列表（从直接升级到最终升级）
 */
export function GetItemUpgradeChain(itemName: string): string[] {
  const config = ItemTierConfig[itemName];
  return config?.upgrades || [];
}
