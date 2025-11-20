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
 * 装备槽位枚举
 * 用于智能替换同槽位的低等级装备
 */
export enum ItemSlot {
  /** 核心输出装备 (攻击力/法术输出) */
  Core = 'core',
  /** 防御装备 (护甲/血量/魔抗) */
  Defense = 'defense',
  /** 移动装备 (鞋子/跳刀/移速) */
  Mobility = 'mobility',
  /** 控制装备 (羊刀/深渊/眩晕) */
  Control = 'control',
  /** 工具装备 (推推/BKB/微光等功能性装备) */
  Utility = 'utility',
  /** 消耗品 (可消耗的装备) */
  Consumable = 'consumable',
}

/**
 * 装备配置接口
 */
export interface ItemConfig {
  /** 装备名称 */
  name: string;
  /** 装备等级 */
  tier: ItemTier;
  /** 装备槽位 */
  slot: ItemSlot;
  /** 实际金钱(用于验证) */
  cost: number;
  /** 可过渡到的高级装备列表(可选) */
  upgradesTo?: string[];
}

/**
 * 所有装备的等级配置
 * 基于 -itemcost 命令输出的实际金钱数据
 */
export const ItemTierConfig: Record<string, ItemConfig> = {
  // ===== T1: 早期装备 (<2000金) =====

  // 基础装备
  item_boots: { name: 'item_boots', tier: ItemTier.T1, slot: ItemSlot.Mobility, cost: 500 },
  item_magic_wand: {
    name: 'item_magic_wand',
    tier: ItemTier.T1,
    slot: ItemSlot.Utility,
    cost: 450,
  },
  item_bracer: { name: 'item_bracer', tier: ItemTier.T1, slot: ItemSlot.Defense, cost: 500 },
  item_null_talisman: {
    name: 'item_null_talisman',
    tier: ItemTier.T1,
    slot: ItemSlot.Utility,
    cost: 500,
  },
  item_wraith_band: {
    name: 'item_wraith_band',
    tier: ItemTier.T1,
    slot: ItemSlot.Utility,
    cost: 500,
  },
  item_quelling_blade_2_datadriven: {
    name: 'item_quelling_blade_2_datadriven',
    tier: ItemTier.T1,
    slot: ItemSlot.Utility,
    cost: 600,
  },

  // 早期功能装备
  item_soul_ring: { name: 'item_soul_ring', tier: ItemTier.T1, slot: ItemSlot.Utility, cost: 805 },
  item_tranquil_boots: {
    name: 'item_tranquil_boots',
    tier: ItemTier.T1,
    slot: ItemSlot.Mobility,
    cost: 900,
  },
  item_orb_of_corrosion: {
    name: 'item_orb_of_corrosion',
    tier: ItemTier.T1,
    slot: ItemSlot.Core,
    cost: 1050,
  },
  item_falcon_blade: {
    name: 'item_falcon_blade',
    tier: ItemTier.T1,
    slot: ItemSlot.Utility,
    cost: 1125,
  },

  // T1鞋子
  item_power_treads: {
    name: 'item_power_treads',
    tier: ItemTier.T1,
    slot: ItemSlot.Mobility,
    cost: 1400,
    upgradesTo: ['item_adi_king', 'item_adi_king_plus'],
  },
  item_arcane_boots: {
    name: 'item_arcane_boots',
    tier: ItemTier.T1,
    slot: ItemSlot.Mobility,
    cost: 1400,
  },
  item_phase_boots: {
    name: 'item_phase_boots',
    tier: ItemTier.T1,
    slot: ItemSlot.Mobility,
    cost: 1500,
    upgradesTo: ['item_adi_king', 'item_adi_king_plus'],
  },

  // 早期防御/核心
  item_vanguard: { name: 'item_vanguard', tier: ItemTier.T1, slot: ItemSlot.Defense, cost: 1700 },
  item_mask_of_madness: {
    name: 'item_mask_of_madness',
    tier: ItemTier.T1,
    slot: ItemSlot.Core,
    cost: 1900,
  },

  // ===== T2: 中期过渡 (2000-5000金) =====

  // 三系列基础
  item_kaya: {
    name: 'item_kaya',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 2100,
    upgradesTo: ['item_kaya_and_sange', 'item_yasha_and_kaya', 'item_sacred_trident'],
  },
  item_sange: {
    name: 'item_sange',
    tier: ItemTier.T2,
    slot: ItemSlot.Defense,
    cost: 2100,
    upgradesTo: ['item_sange_and_yasha', 'item_kaya_and_sange', 'item_sacred_trident'],
  },
  item_yasha: {
    name: 'item_yasha',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 2100,
    upgradesTo: ['item_sange_and_yasha', 'item_yasha_and_kaya', 'item_sacred_trident'],
  },

  // 功能装备
  item_glimmer_cape: {
    name: 'item_glimmer_cape',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 2150,
  },
  item_vladmir: {
    name: 'item_vladmir',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 2200,
    upgradesTo: ['item_vladmir_2'],
  },
  item_force_staff: {
    name: 'item_force_staff',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 2200,
    upgradesTo: ['item_force_staff_2', 'item_force_staff_3'],
  },
  item_hand_of_midas: {
    name: 'item_hand_of_midas',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 2200,
    upgradesTo: ['item_hand_of_group'],
  },
  item_holy_locket: {
    name: 'item_holy_locket',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 2250,
  },
  item_blink: {
    name: 'item_blink',
    tier: ItemTier.T2,
    slot: ItemSlot.Mobility,
    cost: 2250,
    upgradesTo: [
      'item_swift_blink',
      'item_overwhelming_blink',
      'item_arcane_blink_2',
      'item_jump_jump_jump',
    ],
  },
  item_rod_of_atos: {
    name: 'item_rod_of_atos',
    tier: ItemTier.T2,
    slot: ItemSlot.Control,
    cost: 2250,
  },

  // 防御/核心装备
  item_blade_mail: {
    name: 'item_blade_mail',
    tier: ItemTier.T2,
    slot: ItemSlot.Defense,
    cost: 2300,
    upgradesTo: ['item_blade_mail_2'],
  },
  item_aether_lens: {
    name: 'item_aether_lens',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 2350,
    upgradesTo: ['item_aether_lens_2'],
  },
  item_armlet: {
    name: 'item_armlet',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 2500,
    upgradesTo: ['item_armlet_plus', 'item_armlet_pro_max'],
  },
  item_travel_boots: {
    name: 'item_travel_boots',
    tier: ItemTier.T2,
    slot: ItemSlot.Mobility,
    cost: 2500,
  },
  item_heavens_halberd: {
    name: 'item_heavens_halberd',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 2600,
    upgradesTo: ['item_heavens_halberd_v2'],
  },
  item_echo_sabre: {
    name: 'item_echo_sabre',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 2700,
    upgradesTo: ['item_echo_sabre_2'],
  },
  item_basher: {
    name: 'item_basher',
    tier: ItemTier.T2,
    slot: ItemSlot.Control,
    cost: 2875,
    upgradesTo: ['item_abyssal_blade', 'item_abyssal_blade_v2'],
  },

  // 高价T2装备
  item_aeon_disk: {
    name: 'item_aeon_disk',
    tier: ItemTier.T2,
    slot: ItemSlot.Defense,
    cost: 3000,
    upgradesTo: ['item_aeon_pendant'],
  },
  item_aether_lens_2: {
    name: 'item_aether_lens_2',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 3200,
  },
  item_desolator: {
    name: 'item_desolator',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 3500,
    upgradesTo: ['item_dodo_desolator', 'item_infernal_desolator'],
  },

  // 特殊装备
  item_wings_of_haste: {
    name: 'item_wings_of_haste',
    tier: ItemTier.T2,
    slot: ItemSlot.Consumable,
    cost: 3700,
  },
  item_eternal_shroud: {
    name: 'item_eternal_shroud',
    tier: ItemTier.T2,
    slot: ItemSlot.Defense,
    cost: 3700,
    upgradesTo: ['item_eternal_shroud_ultra'],
  },
  item_force_staff_2: {
    name: 'item_force_staff_2',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 3700,
    upgradesTo: ['item_force_staff_3'],
  },
  item_pipe: { name: 'item_pipe', tier: ItemTier.T2, slot: ItemSlot.Defense, cost: 3725 },
  item_lotus_orb: {
    name: 'item_lotus_orb',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 3850,
    upgradesTo: ['item_saint_orb'],
  },
  item_bfury: {
    name: 'item_bfury',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 3900,
    upgradesTo: ['item_bfury_ultra'],
  },

  // 核心装备
  item_black_king_bar: {
    name: 'item_black_king_bar',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 4050,
    upgradesTo: ['item_black_king_bar_2'],
  },
  item_yasha_and_kaya: {
    name: 'item_yasha_and_kaya',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4200,
    upgradesTo: ['item_sacred_trident', 'item_sacred_six_vein'],
  },
  item_ultimate_scepter: {
    name: 'item_ultimate_scepter',
    tier: ItemTier.T2,
    slot: ItemSlot.Consumable,
    cost: 4200,
    upgradesTo: ['item_ultimate_scepter_2'],
  },
  item_kaya_and_sange: {
    name: 'item_kaya_and_sange',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4200,
    upgradesTo: ['item_sacred_trident', 'item_sacred_six_vein', 'item_kaya_and_sange_1'],
  },
  item_sange_and_yasha: {
    name: 'item_sange_and_yasha',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4200,
    upgradesTo: ['item_sacred_trident', 'item_sacred_six_vein', 'item_sange_and_yasha_1'],
  },
  item_echo_sabre_2: {
    name: 'item_echo_sabre_2',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4325,
  },
  item_bloodstone_v2: {
    name: 'item_bloodstone_v2',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4400,
    upgradesTo: ['item_bloodstone'],
  },
  item_hurricane_pike: {
    name: 'item_hurricane_pike',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4450,
    upgradesTo: ['item_hurricane_pike_2'],
  },
  item_shotgun: {
    name: 'item_shotgun',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4500,
    upgradesTo: ['item_shotgun_v2'],
  },
  item_armlet_plus: {
    name: 'item_armlet_plus',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4500,
    upgradesTo: ['item_armlet_pro_max'],
  },
  item_gungir: {
    name: 'item_gungir',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4550,
    upgradesTo: ['item_gungir_2'],
  },
  item_manta: {
    name: 'item_manta',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4650,
    upgradesTo: ['item_manta_1', 'item_manta_2'],
  },
  item_monkey_king_bar: {
    name: 'item_monkey_king_bar',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4700,
    upgradesTo: ['item_monkey_king_bar_2'],
  },
  item_radiance: {
    name: 'item_radiance',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4700,
    upgradesTo: ['item_radiance_2'],
  },
  item_sphere: {
    name: 'item_sphere',
    tier: ItemTier.T2,
    slot: ItemSlot.Defense,
    cost: 4800,
    upgradesTo: ['item_sphere_2', 'item_saint_orb'],
  },
  item_hand_of_group: {
    name: 'item_hand_of_group',
    tier: ItemTier.T2,
    slot: ItemSlot.Utility,
    cost: 4800,
  },
  item_octarine_core: {
    name: 'item_octarine_core',
    tier: ItemTier.T2,
    slot: ItemSlot.Core,
    cost: 4800,
    upgradesTo: ['item_arcane_octarine_core', 'item_refresh_core'],
  },

  // ===== T3: 中期核心 (5000-10000金) =====

  item_adi_king: {
    name: 'item_adi_king',
    tier: ItemTier.T3,
    slot: ItemSlot.Mobility,
    cost: 5000,
    upgradesTo: ['item_adi_king_plus'],
  },
  item_refresher: {
    name: 'item_refresher',
    tier: ItemTier.T3,
    slot: ItemSlot.Utility,
    cost: 5000,
    upgradesTo: ['item_refresh_core'],
  },
  item_satanic: {
    name: 'item_satanic',
    tier: ItemTier.T3,
    slot: ItemSlot.Defense,
    cost: 5050,
    upgradesTo: ['item_satanic_2'],
  },
  item_arcane_blink_2: {
    name: 'item_arcane_blink_2',
    tier: ItemTier.T3,
    slot: ItemSlot.Mobility,
    cost: 5050,
    upgradesTo: ['item_arcane_blink', 'item_jump_jump_jump'],
  },
  item_guardian_greaves: {
    name: 'item_guardian_greaves',
    tier: ItemTier.T3,
    slot: ItemSlot.Utility,
    cost: 5050,
    upgradesTo: ['item_guardian_greaves_artifact'],
  },
  item_greater_crit: {
    name: 'item_greater_crit',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 5100,
  },
  item_assault: {
    name: 'item_assault',
    tier: ItemTier.T3,
    slot: ItemSlot.Defense,
    cost: 5125,
  },
  item_shivas_guard: {
    name: 'item_shivas_guard',
    tier: ItemTier.T3,
    slot: ItemSlot.Defense,
    cost: 5175,
    upgradesTo: ['item_shivas_guard_2'],
  },
  item_sheepstick: {
    name: 'item_sheepstick',
    tier: ItemTier.T3,
    slot: ItemSlot.Control,
    cost: 5200,
    upgradesTo: ['item_necronomicon_staff'],
  },
  item_heart: {
    name: 'item_heart',
    tier: ItemTier.T3,
    slot: ItemSlot.Defense,
    cost: 5200,
    upgradesTo: ['item_undying_heart'],
  },
  item_force_staff_3: {
    name: 'item_force_staff_3',
    tier: ItemTier.T3,
    slot: ItemSlot.Utility,
    cost: 5200,
  },
  item_swift_blink: {
    name: 'item_swift_blink',
    tier: ItemTier.T3,
    slot: ItemSlot.Mobility,
    cost: 5300,
    upgradesTo: ['item_swift_blink_2', 'item_jump_jump_jump'],
  },
  item_overwhelming_blink: {
    name: 'item_overwhelming_blink',
    tier: ItemTier.T3,
    slot: ItemSlot.Mobility,
    cost: 5300,
    upgradesTo: ['item_overwhelming_blink_2', 'item_jump_jump_jump'],
  },
  item_silver_edge: {
    name: 'item_silver_edge',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 5350,
    upgradesTo: ['item_silver_edge_2'],
  },
  item_ethereal_blade: {
    name: 'item_ethereal_blade',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 5450,
    upgradesTo: ['item_ethereal_blade_ultra'],
  },
  item_butterfly: {
    name: 'item_butterfly',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 5450,
    upgradesTo: ['item_wasp_callous', 'item_wasp_despotic', 'item_wasp_golden'],
  },
  item_mjollnir: { name: 'item_mjollnir', tier: ItemTier.T3, slot: ItemSlot.Core, cost: 5500 },
  item_blade_mail_2: {
    name: 'item_blade_mail_2',
    tier: ItemTier.T3,
    slot: ItemSlot.Defense,
    cost: 5600,
  },
  item_rapier: {
    name: 'item_rapier',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 5600,
    upgradesTo: ['item_excalibur', 'item_rapier_ultra'],
  },
  item_skadi: {
    name: 'item_skadi',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 5900,
    upgradesTo: ['item_skadi_2'],
  },
  item_radiance_2: {
    name: 'item_radiance_2',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 6000,
  },
  item_phylactery: {
    name: 'item_phylactery',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 6000,
  },
  item_aeon_pendant: {
    name: 'item_aeon_pendant',
    tier: ItemTier.T3,
    slot: ItemSlot.Defense,
    cost: 6000,
  },
  item_devastator: {
    name: 'item_devastator',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 6200,
    upgradesTo: ['item_devastator_2'],
  },
  item_abyssal_blade: {
    name: 'item_abyssal_blade',
    tier: ItemTier.T3,
    slot: ItemSlot.Control,
    cost: 6250,
    upgradesTo: ['item_abyssal_blade_v2'],
  },
  item_armlet_pro_max: {
    name: 'item_armlet_pro_max',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 6500,
  },
  item_sphere_2: {
    name: 'item_sphere_2',
    tier: ItemTier.T3,
    slot: ItemSlot.Defense,
    cost: 6800,
    upgradesTo: ['item_saint_orb'],
  },
  item_dagon_5: { name: 'item_dagon_5', tier: ItemTier.T3, slot: ItemSlot.Core, cost: 7450 },
  item_sacred_trident: {
    name: 'item_sacred_trident',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 7800,
    upgradesTo: ['item_sacred_six_vein'],
  },
  item_manta_1: {
    name: 'item_manta_1',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 8000,
    upgradesTo: ['item_manta_2'],
  },
  item_orb_of_the_brine: {
    name: 'item_orb_of_the_brine',
    tier: ItemTier.T3,
    slot: ItemSlot.Utility,
    cost: 8000,
  },
  item_magic_scepter: {
    name: 'item_magic_scepter',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 8000,
    upgradesTo: ['item_hallowed_scepter'],
  },
  item_moon_shard_datadriven: {
    name: 'item_moon_shard_datadriven',
    tier: ItemTier.T3,
    slot: ItemSlot.Consumable,
    cost: 8000,
  },
  item_silver_edge_2: {
    name: 'item_silver_edge_2',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 8350,
  },
  item_dodo_desolator: {
    name: 'item_dodo_desolator',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 8600,
    upgradesTo: ['item_infernal_desolator'],
  },
  item_ultimate_scepter_2: {
    name: 'item_ultimate_scepter_2',
    tier: ItemTier.T3,
    slot: ItemSlot.Consumable,
    cost: 8600,
  },
  item_bloodstone: {
    name: 'item_bloodstone',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 9000,
  },
  item_heavens_halberd_v2: {
    name: 'item_heavens_halberd_v2',
    tier: ItemTier.T3,
    slot: ItemSlot.Utility,
    cost: 9500,
  },
  item_adi_king_plus: {
    name: 'item_adi_king_plus',
    tier: ItemTier.T3,
    slot: ItemSlot.Mobility,
    cost: 9600,
  },
  item_eternal_shroud_ultra: {
    name: 'item_eternal_shroud_ultra',
    tier: ItemTier.T3,
    slot: ItemSlot.Defense,
    cost: 9600,
  },
  item_hurricane_pike_2: {
    name: 'item_hurricane_pike_2',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 9700,
  },
  item_monkey_king_bar_2: {
    name: 'item_monkey_king_bar_2',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 9800,
  },
  item_angels_demise: {
    name: 'item_angels_demise',
    tier: ItemTier.T3,
    slot: ItemSlot.Core,
    cost: 9800,
  },
  item_vladmir_2: {
    name: 'item_vladmir_2',
    tier: ItemTier.T3,
    slot: ItemSlot.Utility,
    cost: 9800,
  },

  // ===== T4: 后期装备 (10000-30000金) =====

  item_wasp_callous: {
    name: 'item_wasp_callous',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 10000,
    upgradesTo: ['item_wasp_golden'],
  },
  item_shotgun_v2: {
    name: 'item_shotgun_v2',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 10000,
  },
  item_wasp_despotic: {
    name: 'item_wasp_despotic',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 10000,
    upgradesTo: ['item_wasp_golden'],
  },
  item_arcane_blink: {
    name: 'item_arcane_blink',
    tier: ItemTier.T4,
    slot: ItemSlot.Mobility,
    cost: 10100,
    upgradesTo: ['item_jump_jump_jump'],
  },
  item_overwhelming_blink_2: {
    name: 'item_overwhelming_blink_2',
    tier: ItemTier.T4,
    slot: ItemSlot.Mobility,
    cost: 10600,
    upgradesTo: ['item_jump_jump_jump'],
  },
  item_arcane_octarine_core: {
    name: 'item_arcane_octarine_core',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 10600,
  },
  item_swift_blink_2: {
    name: 'item_swift_blink_2',
    tier: ItemTier.T4,
    slot: ItemSlot.Mobility,
    cost: 10600,
    upgradesTo: ['item_jump_jump_jump'],
  },
  item_insight_armor: {
    name: 'item_insight_armor',
    tier: ItemTier.T4,
    slot: ItemSlot.Defense,
    cost: 10800,
  },
  item_abyssal_blade_v2: {
    name: 'item_abyssal_blade_v2',
    tier: ItemTier.T4,
    slot: ItemSlot.Control,
    cost: 10800,
  },
  item_saint_orb: {
    name: 'item_saint_orb',
    tier: ItemTier.T4,
    slot: ItemSlot.Defense,
    cost: 11000,
  },
  item_manta_2: {
    name: 'item_manta_2',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 11100,
  },
  item_black_king_bar_2: {
    name: 'item_black_king_bar_2',
    tier: ItemTier.T4,
    slot: ItemSlot.Utility,
    cost: 11600,
  },
  item_ethereal_blade_ultra: {
    name: 'item_ethereal_blade_ultra',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 12000,
  },
  item_skadi_2: {
    name: 'item_skadi_2',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 12000,
  },
  item_satanic_2: {
    name: 'item_satanic_2',
    tier: ItemTier.T4,
    slot: ItemSlot.Defense,
    cost: 12000,
  },
  item_bfury_ultra: {
    name: 'item_bfury_ultra',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 12000,
  },
  item_devastator_2: {
    name: 'item_devastator_2',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 12600,
  },
  item_undying_heart: {
    name: 'item_undying_heart',
    tier: ItemTier.T4,
    slot: ItemSlot.Defense,
    cost: 13800,
  },
  item_shivas_guard_2: {
    name: 'item_shivas_guard_2',
    tier: ItemTier.T4,
    slot: ItemSlot.Defense,
    cost: 14000,
  },
  item_kaya_and_sange_1: {
    name: 'item_kaya_and_sange_1',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 14000,
  },
  item_sange_and_yasha_1: {
    name: 'item_sange_and_yasha_1',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 14000,
  },
  item_gungir_2: {
    name: 'item_gungir_2',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 15000,
  },
  item_infernal_desolator: {
    name: 'item_infernal_desolator',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 15600,
  },
  item_sacred_six_vein: {
    name: 'item_sacred_six_vein',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 15600,
  },
  item_jump_jump_jump: {
    name: 'item_jump_jump_jump',
    tier: ItemTier.T4,
    slot: ItemSlot.Mobility,
    cost: 15650,
  },
  item_necronomicon_staff: {
    name: 'item_necronomicon_staff',
    tier: ItemTier.T4,
    slot: ItemSlot.Control,
    cost: 16000,
  },
  item_force_field_ultra: {
    name: 'item_force_field_ultra',
    tier: ItemTier.T4,
    slot: ItemSlot.Defense,
    cost: 16600,
  },
  item_blue_fantasy: {
    name: 'item_blue_fantasy',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 16745,
  },
  item_hallowed_scepter: {
    name: 'item_hallowed_scepter',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 16800,
  },
  item_refresh_core: {
    name: 'item_refresh_core',
    tier: ItemTier.T4,
    slot: ItemSlot.Utility,
    cost: 19800,
  },
  item_guardian_greaves_artifact: {
    name: 'item_guardian_greaves_artifact',
    tier: ItemTier.T4,
    slot: ItemSlot.Utility,
    cost: 19900,
  },
  item_tome_of_agility: {
    name: 'item_tome_of_agility',
    tier: ItemTier.T4,
    slot: ItemSlot.Consumable,
    cost: 19999,
  },
  item_tome_of_intelligence: {
    name: 'item_tome_of_intelligence',
    tier: ItemTier.T4,
    slot: ItemSlot.Consumable,
    cost: 19999,
  },
  item_tome_of_strength: {
    name: 'item_tome_of_strength',
    tier: ItemTier.T4,
    slot: ItemSlot.Consumable,
    cost: 19999,
  },
  item_wasp_golden: {
    name: 'item_wasp_golden',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 20000,
  },
  item_excalibur: {
    name: 'item_excalibur',
    tier: ItemTier.T4,
    slot: ItemSlot.Core,
    cost: 29800,
    upgradesTo: ['item_rapier_ultra'],
  },

  // ===== T5: 终极装备 (>30000金) =====

  item_rapier_ultra: {
    name: 'item_rapier_ultra',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 44000,
    upgradesTo: ['item_rapier_ultra_bot'],
  },
  item_hawkeye_fighter: {
    name: 'item_hawkeye_fighter',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 56349,
  },
  item_dracula_mask: {
    name: 'item_dracula_mask',
    tier: ItemTier.T5,
    slot: ItemSlot.Defense,
    cost: 57449,
  },
  item_forbidden_staff: {
    name: 'item_forbidden_staff',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 58449,
  },
  item_rapier_ultra_bot: {
    name: 'item_rapier_ultra_bot',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 60000,
    upgradesTo: ['item_rapier_ultra_bot_1'],
  },
  item_tome_of_luoshu: {
    name: 'item_tome_of_luoshu',
    tier: ItemTier.T5,
    slot: ItemSlot.Consumable,
    cost: 60000,
  },
  item_rapier_ultra_bot_1: {
    name: 'item_rapier_ultra_bot_1',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 60000,
  },
  item_swift_glove: {
    name: 'item_swift_glove',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 60099,
  },
  item_forbidden_blade: {
    name: 'item_forbidden_blade',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 62544,
  },
  item_shadow_impact: {
    name: 'item_shadow_impact',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 65249,
  },
  item_hawkeye_turret: {
    name: 'item_hawkeye_turret',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 65299,
  },
  item_withered_spring: {
    name: 'item_withered_spring',
    tier: ItemTier.T5,
    slot: ItemSlot.Defense,
    cost: 65649,
  },
  item_magic_crit_blade: {
    name: 'item_magic_crit_blade',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 65999,
  },
  item_beast_armor: {
    name: 'item_beast_armor',
    tier: ItemTier.T5,
    slot: ItemSlot.Defense,
    cost: 66599,
  },
  item_magic_sword: {
    name: 'item_magic_sword',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 69599,
  },
  item_beast_shield: {
    name: 'item_beast_shield',
    tier: ItemTier.T5,
    slot: ItemSlot.Defense,
    cost: 71799,
  },
  item_time_gem: {
    name: 'item_time_gem',
    tier: ItemTier.T5,
    slot: ItemSlot.Utility,
    cost: 77799,
  },
  item_switchable_crit_blade: {
    name: 'item_switchable_crit_blade',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
    cost: 79799,
  },
  item_ten_thousand_swords: {
    name: 'item_ten_thousand_swords',
    tier: ItemTier.T5,
    slot: ItemSlot.Core,
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
 * 根据装备名称获取装备槽位
 */
export function getItemSlot(itemName: string): ItemSlot | undefined {
  return ItemTierConfig[itemName]?.slot;
}

/**
 * 检查装备A是否可以升级到装备B
 */
export function canUpgradeTo(fromItem: string, toItem: string): boolean {
  const config = ItemTierConfig[fromItem];
  if (!config || !config.upgradesTo) {
    return false;
  }
  return config.upgradesTo.includes(toItem);
}
