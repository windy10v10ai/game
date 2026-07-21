/**
 * 装备等级配置
 * 基于实际装备金钱划分为5个等级
 */

/**
 * 装备等级枚举
 * 基于实际金钱划分，区间为左开右开 (下限, 上限)，T5 下限为闭区间
 * T1: cost <= 2000 - 早期装备
 * T2: 2000 < cost <= 5000 - 中期过渡
 * T3: 5000 < cost <= 10000 - 中期核心
 * T4: 10000 < cost < 30000 - 后期装备
 * T5: cost >= 30000 - 终极装备
 * 特殊道具需要偏离价格规则时，在该条目旁加注释说明原因，不要改规则本身
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
  /** 装备中文名（用于日志展示） */
  nameCN: string;
  /** 装备等级 */
  tier: ItemTier;
  /** 实际金钱(用于验证) */
  cost: number;
  /** 直接下位装备（材料/前置版本），只写直接下一层，多条合成路线写多个 */
  baseItems?: string[];
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
    nameCN: '速度之靴',
    tier: ItemTier.T1,
    cost: 500,
  },
  item_magic_wand: {
    name: 'item_magic_wand',
    nameCN: '魔杖',
    tier: ItemTier.T1,
    cost: 460,
  },
  item_bracer: { name: 'item_bracer', nameCN: '护腕', tier: ItemTier.T1, cost: 500 },
  item_null_talisman: {
    name: 'item_null_talisman',
    nameCN: '空灵挂件',
    tier: ItemTier.T1,
    cost: 500,
  },
  item_wraith_band: {
    name: 'item_wraith_band',
    nameCN: '怨灵系带',
    tier: ItemTier.T1,
    cost: 500,
  },
  item_quelling_blade_2_datadriven: {
    name: 'item_quelling_blade_2_datadriven',
    nameCN: '毒瘤之刃',
    tier: ItemTier.T1,
    cost: 600,
  },

  // 消耗品
  item_blood_grenade: {
    name: 'item_blood_grenade',
    nameCN: '血腥榴弹',
    tier: ItemTier.T1,
    cost: 100,
  },
  item_clarity: {
    name: 'item_clarity',
    nameCN: '净化药水',
    tier: ItemTier.T1,
    cost: 50,
  },
  item_tango: {
    name: 'item_tango',
    nameCN: '树之祭祀',
    tier: ItemTier.T1,
    cost: 120,
  },
  item_flask: {
    name: 'item_flask',
    nameCN: '治疗药膏',
    tier: ItemTier.T1,
    cost: 110,
  },
  item_enchanted_mango: {
    name: 'item_enchanted_mango',
    nameCN: '魔法芒果',
    tier: ItemTier.T1,
    cost: 260,
  },
  item_faerie_fire: {
    name: 'item_faerie_fire',
    nameCN: '仙灵之火',
    tier: ItemTier.T1,
    cost: 260,
  },
  item_infused_raindrop: {
    name: 'item_infused_raindrop',
    nameCN: '凝魂之露',
    tier: ItemTier.T1,
    cost: 675,
  },

  // 早期功能装备
  item_soul_ring: { name: 'item_soul_ring', nameCN: '灵魂之戒', tier: ItemTier.T1, cost: 805 },
  item_tranquil_boots: {
    name: 'item_tranquil_boots',
    nameCN: '静谧之鞋',
    tier: ItemTier.T1,
    cost: 900,
    baseItems: ['item_boots'],
  },
  item_orb_of_corrosion: {
    name: 'item_orb_of_corrosion',
    nameCN: '腐蚀之珠',
    tier: ItemTier.T1,
    cost: 1050,
  },
  item_ancient_janggo: {
    name: 'item_ancient_janggo',
    nameCN: '韧鼓',
    tier: ItemTier.T1,
    cost: 1625,
  },
  item_essence_distiller: {
    name: 'item_essence_distiller',
    nameCN: '精之灵器',
    tier: ItemTier.T1,
    cost: 1775,
  },
  item_oblivion_staff: {
    name: 'item_oblivion_staff',
    nameCN: '空明杖',
    tier: ItemTier.T1,
    cost: 1625,
  },
  item_falcon_blade: {
    name: 'item_falcon_blade',
    nameCN: '猎鹰战刃',
    tier: ItemTier.T1,
    cost: 1125,
  },

  // T1鞋子
  item_power_treads: {
    name: 'item_power_treads',
    nameCN: '动力鞋',
    tier: ItemTier.T1,
    cost: 1400,
    baseItems: ['item_boots'],
  },
  item_arcane_boots: {
    name: 'item_arcane_boots',
    nameCN: '奥术鞋',
    tier: ItemTier.T1,
    cost: 1500,
    baseItems: ['item_boots'],
  },
  item_phase_boots: {
    name: 'item_phase_boots',
    nameCN: '相位鞋',
    tier: ItemTier.T1,
    cost: 1450,
    baseItems: ['item_boots', 'item_power_treads'],
  },

  // 早期防御/核心
  item_vanguard: { name: 'item_vanguard', nameCN: '先锋盾', tier: ItemTier.T1, cost: 1700 },
  item_veil_of_discord: {
    name: 'item_veil_of_discord',
    nameCN: '纷争面纱',
    tier: ItemTier.T1,
    cost: 1700,
  },
  item_mask_of_madness: {
    name: 'item_mask_of_madness',
    nameCN: '疯狂面具',
    tier: ItemTier.T1,
    cost: 1900,
  },
  item_lesser_crit: {
    name: 'item_lesser_crit',
    nameCN: '水晶剑',
    tier: ItemTier.T1,
    cost: 2000,
  },
  item_hyperstone: {
    name: 'item_hyperstone',
    nameCN: '振奋宝石',
    tier: ItemTier.T1,
    cost: 2000,
  },
  item_buckler: {
    name: 'item_buckler',
    nameCN: '玄冥盾牌',
    tier: ItemTier.T1,
    cost: 425,
  },
  item_headdress: {
    name: 'item_headdress',
    nameCN: '恢复头巾',
    tier: ItemTier.T1,
    cost: 425,
  },
  item_mekansm: {
    name: 'item_mekansm',
    nameCN: '梅肯斯姆',
    tier: ItemTier.T1,
    cost: 1775,
    baseItems: ['item_headdress'],
  },

  // ===== T2: 中期过渡 (2000-5000金) =====

  // 三系列基础
  item_kaya: {
    name: 'item_kaya',
    nameCN: '慧光',
    tier: ItemTier.T2,
    cost: 2100,
  },
  item_sange: {
    name: 'item_sange',
    nameCN: '散华',
    tier: ItemTier.T2,
    cost: 2100,
  },
  item_yasha: {
    name: 'item_yasha',
    nameCN: '夜叉',
    tier: ItemTier.T2,
    cost: 2100,
  },

  // 功能装备
  item_glimmer_cape: {
    name: 'item_glimmer_cape',
    nameCN: '微光披风',
    tier: ItemTier.T2,
    cost: 2150,
  },
  item_solar_crest: {
    name: 'item_solar_crest',
    nameCN: '炎阳纹章',
    tier: ItemTier.T2,
    cost: 2575,
  },
  item_consecrated_wraps: {
    name: 'item_consecrated_wraps',
    nameCN: '圣化护服',
    tier: ItemTier.T2,
    cost: 2600,
  },
  item_vladmir: {
    name: 'item_vladmir',
    nameCN: '弗拉迪米尔的祭品',
    tier: ItemTier.T2,
    cost: 2200,
  },
  item_force_staff: {
    name: 'item_force_staff',
    nameCN: '原力法杖',
    tier: ItemTier.T2,
    cost: 2200,
  },
  item_hand_of_midas: {
    name: 'item_hand_of_midas',
    nameCN: '迈达斯之手',
    tier: ItemTier.T1, // 迈达斯之手：价格属于 T2 区间，但作为早期核心冲装特意归入 T1
    cost: 2200,
  },
  item_holy_locket: {
    name: 'item_holy_locket',
    nameCN: '圣洁吊坠',
    tier: ItemTier.T2,
    cost: 2250,
    baseItems: ['item_magic_wand'],
  },
  item_revenants_brooch: {
    name: 'item_revenants_brooch',
    nameCN: '英灵胸针',
    tier: ItemTier.T2,
    cost: 3300,
  },
  item_blink: {
    name: 'item_blink',
    nameCN: '闪烁匕首',
    tier: ItemTier.T2,
    cost: 2250,
  },
  item_rod_of_atos: {
    name: 'item_rod_of_atos',
    nameCN: '阿托斯之棍',
    tier: ItemTier.T2,
    cost: 2250,
  },
  item_eagle: {
    name: 'item_eagle',
    nameCN: '鹰歌弓',
    tier: ItemTier.T2,
    cost: 2800,
  },

  // 防御/核心装备
  item_blade_mail: {
    name: 'item_blade_mail',
    nameCN: '刃甲',
    tier: ItemTier.T2,
    cost: 2400,
  },
  item_aether_lens: {
    name: 'item_aether_lens',
    nameCN: '以太透镜',
    tier: ItemTier.T2,
    cost: 2350,
  },
  item_armlet: {
    name: 'item_armlet',
    nameCN: '莫尔迪基安的臂章',
    tier: ItemTier.T2,
    cost: 2500,
  },
  item_travel_boots: {
    name: 'item_travel_boots',
    nameCN: '远行鞋',
    tier: ItemTier.T2,
    cost: 2500,
  },
  item_heavens_halberd: {
    name: 'item_heavens_halberd',
    nameCN: '天堂之戟',
    tier: ItemTier.T2,
    cost: 2600,
  },
  item_cyclone: {
    name: 'item_cyclone',
    nameCN: 'Eul的神圣法杖',
    tier: ItemTier.T2,
    cost: 2600,
  },
  item_echo_sabre: {
    name: 'item_echo_sabre',
    nameCN: '回音战刃',
    tier: ItemTier.T2,
    cost: 2700,
  },
  item_witch_blade: {
    name: 'item_witch_blade',
    nameCN: '巫师之刃',
    tier: ItemTier.T2,
    cost: 2775,
  },
  item_basher: {
    name: 'item_basher',
    nameCN: '碎颅锤',
    tier: ItemTier.T2,
    cost: 2875,
  },
  item_maelstrom: {
    name: 'item_maelstrom',
    nameCN: '漩涡',
    tier: ItemTier.T2,
    cost: 2950,
  },

  // 高价T2装备
  item_aeon_disk: {
    name: 'item_aeon_disk',
    nameCN: '永恒之盘',
    tier: ItemTier.T2,
    cost: 3000,
  },
  item_aether_lens_2: {
    name: 'item_aether_lens_2',
    nameCN: '以太透镜2',
    tier: ItemTier.T2,
    cost: 3200,
    baseItems: ['item_aether_lens'],
  },
  item_invis_sword: {
    name: 'item_invis_sword',
    nameCN: '影刃',
    tier: ItemTier.T2,
    cost: 3250,
  },
  item_desolator: {
    name: 'item_desolator',
    nameCN: '黯灭',
    tier: ItemTier.T2,
    cost: 3500,
  },
  item_nullifier: {
    name: 'item_nullifier',
    nameCN: '否决坠饰',
    tier: ItemTier.T2,
    cost: 4350,
  },
  item_crimson_guard: {
    name: 'item_crimson_guard',
    nameCN: '赤红甲',
    tier: ItemTier.T2,
    cost: 3725,
  },

  // 特殊装备
  item_wings_of_haste: {
    name: 'item_wings_of_haste',
    nameCN: '急速之翼',
    tier: ItemTier.T2,
    cost: 3700,
  },
  item_eternal_shroud: {
    name: 'item_eternal_shroud',
    nameCN: '永世法衣',
    tier: ItemTier.T2,
    cost: 3700,
  },
  item_force_staff_2: {
    name: 'item_force_staff_2',
    nameCN: '风力法杖',
    tier: ItemTier.T2,
    cost: 3700,
    baseItems: ['item_force_staff'],
  },
  item_pipe: { name: 'item_pipe', nameCN: '洞察烟斗', tier: ItemTier.T2, cost: 3725 },
  item_specialists_array: {
    name: 'item_specialists_array',
    nameCN: '行家阵列',
    tier: ItemTier.T2,
    cost: 3800,
  },
  item_lotus_orb: {
    name: 'item_lotus_orb',
    nameCN: '清莲宝珠',
    tier: ItemTier.T2,
    cost: 3850,
  },
  item_bfury: {
    name: 'item_bfury',
    nameCN: '狂战斧',
    tier: ItemTier.T2,
    cost: 3900,
  },

  // 核心装备
  item_black_king_bar: {
    name: 'item_black_king_bar',
    nameCN: '黑皇杖',
    tier: ItemTier.T2,
    cost: 4050,
  },
  item_yasha_and_kaya: {
    name: 'item_yasha_and_kaya',
    nameCN: '慧夜对剑',
    tier: ItemTier.T2,
    cost: 4200,
    baseItems: ['item_kaya', 'item_yasha'],
  },
  item_ultimate_scepter: {
    name: 'item_ultimate_scepter',
    nameCN: '阿哈利姆神杖',
    tier: ItemTier.T2,
    cost: 4200,
  },
  item_kaya_and_sange: {
    name: 'item_kaya_and_sange',
    nameCN: '散慧对剑',
    tier: ItemTier.T2,
    cost: 4200,
    baseItems: ['item_kaya', 'item_sange'],
  },
  item_sange_and_yasha: {
    name: 'item_sange_and_yasha',
    nameCN: '散夜对剑',
    tier: ItemTier.T2,
    cost: 4200,
    baseItems: ['item_sange', 'item_yasha'],
  },
  item_echo_sabre_2: {
    name: 'item_echo_sabre_2',
    nameCN: '音速战刃',
    tier: ItemTier.T2,
    cost: 4325,
    baseItems: ['item_echo_sabre'],
  },
  item_bloodstone_v2: {
    name: 'item_bloodstone_v2',
    nameCN: '迷你血精石',
    tier: ItemTier.T2,
    cost: 4400,
  },
  item_hurricane_pike: {
    name: 'item_hurricane_pike',
    nameCN: '飓风长戟',
    tier: ItemTier.T2,
    cost: 4450,
  },
  item_shotgun: {
    name: 'item_shotgun',
    nameCN: '双管霰弹枪',
    tier: ItemTier.T2,
    cost: 4500,
  },
  item_armlet_plus: {
    name: 'item_armlet_plus',
    nameCN: '小鸡臂章Plus',
    tier: ItemTier.T2,
    cost: 4500,
    baseItems: ['item_armlet'],
  },
  item_gungir: {
    name: 'item_gungir',
    nameCN: '缚灵索',
    tier: ItemTier.T2,
    cost: 4550,
  },
  item_manta: {
    name: 'item_manta',
    nameCN: '幻影斧',
    tier: ItemTier.T2,
    cost: 4650,
  },
  item_monkey_king_bar: {
    name: 'item_monkey_king_bar',
    nameCN: '金箍棒',
    tier: ItemTier.T2,
    cost: 5000,
  },
  item_radiance: {
    name: 'item_radiance',
    nameCN: '辉耀',
    tier: ItemTier.T2,
    cost: 4700,
  },
  item_sphere: {
    name: 'item_sphere',
    nameCN: '林肯法球',
    tier: ItemTier.T2,
    cost: 4800,
  },
  item_hand_of_group: {
    name: 'item_hand_of_group',
    nameCN: '团队之手',
    tier: ItemTier.T2,
    cost: 4800,
    baseItems: ['item_hand_of_midas'],
  },
  item_crellas_crozier: {
    name: 'item_crellas_crozier',
    nameCN: '克莱拉牧杖',
    tier: ItemTier.T2,
    cost: 4800,
  },
  item_octarine_core: {
    name: 'item_octarine_core',
    nameCN: '玲珑心',
    tier: ItemTier.T2,
    cost: 4800,
  },

  // ===== T3: 中期核心 (5000-10000金) =====

  item_adi_king: {
    name: 'item_adi_king',
    nameCN: '阿迪王',
    tier: ItemTier.T2,
    cost: 5000,
    baseItems: ['item_phase_boots', 'item_power_treads'],
  },
  item_refresher: {
    name: 'item_refresher',
    nameCN: '刷新球',
    tier: ItemTier.T2,
    cost: 5000,
  },
  item_satanic: {
    name: 'item_satanic',
    nameCN: '撒旦之邪力',
    tier: ItemTier.T3,
    cost: 5050,
  },
  item_arcane_blink_2: {
    name: 'item_arcane_blink_2',
    nameCN: '秘奥闪光',
    tier: ItemTier.T3,
    cost: 5050,
    baseItems: ['item_blink'],
  },
  item_guardian_greaves: {
    name: 'item_guardian_greaves',
    nameCN: '卫士胫甲',
    tier: ItemTier.T2,
    cost: 4450,
  },
  item_greater_crit: {
    name: 'item_greater_crit',
    nameCN: '代达罗斯之殇',
    tier: ItemTier.T3,
    cost: 5100,
    baseItems: ['item_lesser_crit'],
  },
  item_assault: {
    name: 'item_assault',
    nameCN: '强袭胸甲',
    tier: ItemTier.T3,
    cost: 5125,
  },
  item_shivas_guard: {
    name: 'item_shivas_guard',
    nameCN: '希瓦的守护',
    tier: ItemTier.T2,
    cost: 4500,
  },
  item_sheepstick: {
    name: 'item_sheepstick',
    nameCN: '邪恶镰刀',
    tier: ItemTier.T3,
    cost: 5200,
  },
  item_heart: {
    name: 'item_heart',
    nameCN: '恐鳌之心',
    tier: ItemTier.T3,
    cost: 5200,
  },
  item_force_staff_3: {
    name: 'item_force_staff_3',
    nameCN: '黄金法杖',
    tier: ItemTier.T3,
    cost: 5200,
    baseItems: ['item_force_staff', 'item_force_staff_2'],
  },
  item_swift_blink: {
    name: 'item_swift_blink',
    nameCN: '迅疾闪光',
    tier: ItemTier.T3,
    cost: 5300,
    baseItems: ['item_blink'],
  },
  item_overwhelming_blink: {
    name: 'item_overwhelming_blink',
    nameCN: '盛势闪光',
    tier: ItemTier.T3,
    cost: 5300,
    baseItems: ['item_blink'],
  },
  item_silver_edge: {
    name: 'item_silver_edge',
    nameCN: '白银之锋',
    tier: ItemTier.T3,
    cost: 5350,
  },
  item_ethereal_blade: {
    name: 'item_ethereal_blade',
    nameCN: '虚灵之刃',
    tier: ItemTier.T3,
    cost: 5450,
  },
  item_butterfly: {
    name: 'item_butterfly',
    nameCN: '蝴蝶',
    tier: ItemTier.T3,
    cost: 5450,
  },
  item_mjollnir: {
    name: 'item_mjollnir',
    nameCN: '雷神之锤',
    tier: ItemTier.T3,
    cost: 5500,
    baseItems: ['item_maelstrom'],
  },
  item_blade_mail_2: {
    name: 'item_blade_mail_2',
    nameCN: '刃甲2',
    tier: ItemTier.T3,
    cost: 5800,
    baseItems: ['item_blade_mail'],
  },
  item_rapier: {
    name: 'item_rapier',
    nameCN: '圣剑',
    tier: ItemTier.T3,
    cost: 5600,
  },
  item_skadi: {
    name: 'item_skadi',
    nameCN: '斯嘉蒂之眼',
    tier: ItemTier.T3,
    cost: 5900,
  },
  item_radiance_2: {
    name: 'item_radiance_2',
    nameCN: '圣焰之光',
    tier: ItemTier.T3,
    cost: 6000,
    baseItems: ['item_radiance'],
  },
  item_disperser_chaos: {
    name: 'item_disperser_chaos',
    nameCN: '混沌·散魂剑',
    tier: ItemTier.T3,
    cost: 6100,
  },
  item_veil_of_discord_2: {
    name: 'item_veil_of_discord_2',
    nameCN: '赫拉的神秘面纱',
    tier: ItemTier.T3,
    cost: 6000,
    baseItems: ['item_veil_of_discord'],
  },
  item_phylactery: {
    name: 'item_phylactery',
    nameCN: '灵匣',
    tier: ItemTier.T3,
    cost: 6000,
  },
  item_meteor_hammer_2: {
    name: 'item_meteor_hammer_2',
    nameCN: '星落',
    tier: ItemTier.T3,
    cost: 6000,
  },
  item_aeon_pendant: {
    name: 'item_aeon_pendant',
    nameCN: '咸鱼之王',
    tier: ItemTier.T3,
    cost: 6000,
    baseItems: ['item_aeon_disk'],
  },
  item_devastator: {
    name: 'item_devastator',
    nameCN: '圣斧',
    tier: ItemTier.T3,
    cost: 6200,
  },
  item_abyssal_blade: {
    name: 'item_abyssal_blade',
    nameCN: '深渊之刃',
    tier: ItemTier.T3,
    cost: 6250,
    baseItems: ['item_basher'],
  },
  item_armlet_pro_max: {
    name: 'item_armlet_pro_max',
    nameCN: '小鸡臂章Pro Max',
    tier: ItemTier.T3,
    cost: 6500,
    baseItems: ['item_armlet', 'item_armlet_plus'],
  },
  item_sphere_2: {
    name: 'item_sphere_2',
    nameCN: '真·林肯法球',
    tier: ItemTier.T3,
    cost: 6800,
    baseItems: ['item_sphere'],
  },
  item_dagon_5: { name: 'item_dagon_5', nameCN: '达贡之神力', tier: ItemTier.T3, cost: 7450 },
  item_sacred_trident: {
    name: 'item_sacred_trident',
    nameCN: '三叉戟',
    tier: ItemTier.T3,
    cost: 7800,
    baseItems: [
      'item_kaya',
      'item_kaya_and_sange',
      'item_sange',
      'item_sange_and_yasha',
      'item_yasha',
      'item_yasha_and_kaya',
    ],
  },
  item_manta_1: {
    name: 'item_manta_1',
    nameCN: '幻身斧',
    tier: ItemTier.T3,
    cost: 8000,
    baseItems: ['item_manta'],
  },
  item_orb_of_the_brine: {
    name: 'item_orb_of_the_brine',
    nameCN: '苍洋魔珠',
    tier: ItemTier.T3,
    cost: 8000,
    baseItems: ['item_holy_locket'],
  },
  item_magic_scepter: {
    name: 'item_magic_scepter',
    nameCN: '魔云法杖',
    tier: ItemTier.T3,
    cost: 8000,
    baseItems: ['item_kaya'],
  },
  item_moon_shard_datadriven: {
    name: 'item_moon_shard_datadriven',
    nameCN: '真·银月之晶',
    tier: ItemTier.T3,
    cost: 8000,
  },
  item_silver_edge_2: {
    name: 'item_silver_edge_2',
    nameCN: '无敌之刃',
    tier: ItemTier.T3,
    cost: 8350,
    baseItems: ['item_silver_edge'],
  },
  item_dodo_desolator: {
    name: 'item_dodo_desolator',
    nameCN: '黯灭头',
    tier: ItemTier.T3,
    cost: 8000,
    baseItems: ['item_desolator'],
  },
  item_ultimate_scepter_2: {
    name: 'item_ultimate_scepter_2',
    nameCN: '真·阿哈利姆神杖',
    tier: ItemTier.T3,
    cost: 8600,
    baseItems: ['item_ultimate_scepter'],
  },
  item_bloodstone: {
    name: 'item_bloodstone',
    nameCN: '血精神石',
    tier: ItemTier.T3,
    cost: 9000,
    baseItems: ['item_bloodstone_v2'],
  },
  item_heavens_halberd_v2: {
    name: 'item_heavens_halberd_v2',
    nameCN: '无锋战戟',
    tier: ItemTier.T3,
    cost: 9500,
    baseItems: ['item_heavens_halberd'],
  },
  item_adi_king_plus: {
    name: 'item_adi_king_plus',
    nameCN: '阿迪王plus',
    tier: ItemTier.T3,
    cost: 9600,
    baseItems: ['item_adi_king', 'item_phase_boots'],
  },
  item_eternal_shroud_ultra: {
    name: 'item_eternal_shroud_ultra',
    nameCN: '法师泳衣',
    tier: ItemTier.T3,
    cost: 9600,
    baseItems: ['item_eternal_shroud'],
  },
  item_hurricane_pike_2: {
    name: 'item_hurricane_pike_2',
    nameCN: '黄金魔龙枪 Ultimate',
    tier: ItemTier.T3,
    cost: 9700,
    baseItems: ['item_hurricane_pike'],
  },
  item_angels_demise: {
    name: 'item_angels_demise',
    nameCN: '绝刃',
    tier: ItemTier.T3,
    cost: 9800,
  },
  item_vladmir_2: {
    name: 'item_vladmir_2',
    nameCN: '强袭祭品',
    tier: ItemTier.T3,
    cost: 9800,
    baseItems: ['item_assault', 'item_vladmir'],
  },
  item_wasp_callous: {
    name: 'item_wasp_callous',
    nameCN: '大核荣耀冷酷',
    tier: ItemTier.T3,
    cost: 10000,
    baseItems: ['item_butterfly'],
  },
  item_wasp_despotic: {
    name: 'item_wasp_despotic',
    nameCN: '大核荣耀暴虐',
    tier: ItemTier.T3,
    cost: 10000,
    baseItems: ['item_butterfly'],
  },
  item_hydras_breath: {
    name: 'item_hydras_breath',
    nameCN: '怪蛇之息',
    tier: ItemTier.T3,
    cost: 5900,
  },
  item_revenants_brooch_ultra: {
    name: 'item_revenants_brooch_ultra',
    nameCN: '神器·魔武双修',
    tier: ItemTier.T3,
    cost: 10000,
    baseItems: ['item_revenants_brooch'],
  },
  item_consecrated_wraps_2: {
    name: 'item_consecrated_wraps_2',
    nameCN: '神器·急支糖衣',
    tier: ItemTier.T3,
    cost: 7500,
    baseItems: ['item_consecrated_wraps'],
  },
  item_wind_waker: {
    name: 'item_wind_waker',
    nameCN: '风之杖',
    tier: ItemTier.T3,
    cost: 6800,
  },
  item_boots_of_bearing_2: {
    name: 'item_boots_of_bearing_2',
    nameCN: '神器·蹦迪之鞋',
    tier: ItemTier.T3,
    cost: 9950,
    baseItems: ['item_boots_of_bearing'],
  },
  item_monkey_king_bar_2: {
    name: 'item_monkey_king_bar_2',
    nameCN: '定海神针',
    tier: ItemTier.T3, // 价格属于T4区间，按强度定位手动归入T3
    cost: 10100,
    baseItems: ['item_monkey_king_bar'],
  },

  // ===== T4: 后期装备 (10000-30000金，不含30000) =====
  item_shotgun_v2: {
    name: 'item_shotgun_v2',
    nameCN: '三管霰弹枪',
    tier: ItemTier.T3,
    cost: 10000,
    baseItems: ['item_shotgun'],
  },
  item_arcane_blink: {
    name: 'item_arcane_blink',
    nameCN: '爱因斯坦闪光',
    tier: ItemTier.T4,
    cost: 10100,
    baseItems: ['item_arcane_blink_2'],
  },
  item_overwhelming_blink_2: {
    name: 'item_overwhelming_blink_2',
    nameCN: '泰森闪光',
    tier: ItemTier.T4,
    cost: 10600,
    baseItems: ['item_overwhelming_blink'],
  },
  item_arcane_octarine_core: {
    name: 'item_arcane_octarine_core',
    nameCN: '奥术之心',
    tier: ItemTier.T4,
    cost: 10600,
    baseItems: ['item_aether_lens_2', 'item_octarine_core'],
  },
  item_swift_blink_2: {
    name: 'item_swift_blink_2',
    nameCN: '博尔特闪光',
    tier: ItemTier.T4,
    cost: 10600,
    baseItems: ['item_swift_blink'],
  },
  item_insight_armor: {
    name: 'item_insight_armor',
    nameCN: '洞察盔甲',
    tier: ItemTier.T4,
    cost: 10800,
  },
  item_abyssal_blade_v2: {
    name: 'item_abyssal_blade_v2',
    nameCN: '一闪',
    tier: ItemTier.T4,
    cost: 10800,
    baseItems: ['item_abyssal_blade', 'item_basher'],
  },
  item_saint_orb: {
    name: 'item_saint_orb',
    nameCN: '圣女白莲',
    tier: ItemTier.T4,
    cost: 11200,
    baseItems: ['item_lotus_orb', 'item_sphere', 'item_sphere_2'],
  },
  item_manta_2: {
    name: 'item_manta_2',
    nameCN: '相位斧',
    tier: ItemTier.T4,
    cost: 11100,
    baseItems: ['item_manta', 'item_manta_1'],
  },
  item_black_king_bar_2: {
    name: 'item_black_king_bar_2',
    nameCN: '天神杖',
    tier: ItemTier.T4,
    cost: 11600,
    baseItems: ['item_black_king_bar'],
  },
  item_skadi_2: {
    name: 'item_skadi_2',
    nameCN: '粘妈之眼',
    tier: ItemTier.T4,
    cost: 12000,
    baseItems: ['item_skadi'],
  },
  item_satanic_2: {
    name: 'item_satanic_2',
    nameCN: '真红·撒旦之邪力',
    tier: ItemTier.T4,
    cost: 12000,
    baseItems: ['item_satanic'],
  },
  item_bfury_ultra: {
    name: 'item_bfury_ultra',
    nameCN: '救世狂战',
    tier: ItemTier.T4,
    cost: 12000,
    baseItems: ['item_bfury'],
  },
  item_devastator_2: {
    name: 'item_devastator_2',
    nameCN: '神圣斧',
    tier: ItemTier.T4,
    cost: 12600,
    baseItems: ['item_devastator'],
  },
  item_undying_heart: {
    name: 'item_undying_heart',
    nameCN: '不朽之心',
    tier: ItemTier.T4,
    cost: 13800,
    baseItems: ['item_heart'],
  },
  item_crellas_crozier_2: {
    name: 'item_crellas_crozier_2',
    nameCN: '神器·克莱拉的神化牧杖',
    tier: ItemTier.T4,
    cost: 13500,
    baseItems: ['item_crellas_crozier'],
  },
  item_hydras_breath_2: {
    name: 'item_hydras_breath_2',
    nameCN: '神器·千年毒蛟之息',
    tier: ItemTier.T4,
    cost: 20000,
    baseItems: ['item_hydras_breath'],
  },
  item_armlet_artifact: {
    name: 'item_armlet_artifact',
    nameCN: '神器·光暗臂章',
    tier: ItemTier.T4,
    cost: 18500,
    baseItems: ['item_armlet_pro_max'],
  },
  // 与 item_armlet_artifact 同为 item_armlet_pro_max 的平行分支，二者互斥，同一 tier 不可共存
  item_armlet_light: {
    name: 'item_armlet_light',
    nameCN: '圣光·臂章',
    tier: ItemTier.T4,
    cost: 12500,
    baseItems: ['item_armlet_pro_max'],
  },
  item_shivas_guard_2: {
    name: 'item_shivas_guard_2',
    nameCN: '雅典娜的守护',
    tier: ItemTier.T4,
    cost: 13000,
    baseItems: ['item_shivas_guard'],
  },
  item_mjollnir_2: {
    name: 'item_mjollnir_2',
    nameCN: '神器·神雷锤',
    tier: ItemTier.T4,
    cost: 14000,
    baseItems: ['item_mjollnir'],
  },
  item_kaya_and_sange_1: {
    name: 'item_kaya_and_sange_1',
    nameCN: '神器·散慧对剑',
    tier: ItemTier.T4,
    cost: 14000,
    baseItems: ['item_kaya_and_sange'],
  },
  item_sange_and_yasha_1: {
    name: 'item_sange_and_yasha_1',
    nameCN: '神器·散夜对剑',
    tier: ItemTier.T4,
    cost: 14000,
    baseItems: ['item_sange_and_yasha'],
  },
  item_yasha_and_kaya_1: {
    name: 'item_yasha_and_kaya_1',
    nameCN: '神器·慧夜对剑',
    tier: ItemTier.T4,
    cost: 14000,
    baseItems: ['item_yasha_and_kaya'],
  },
  item_gungir_2: {
    name: 'item_gungir_2',
    nameCN: '风暴之锤',
    tier: ItemTier.T4,
    cost: 15050,
    baseItems: ['item_gungir'],
  },
  item_infernal_desolator: {
    name: 'item_infernal_desolator',
    nameCN: '绝对破防之刃',
    tier: ItemTier.T4,
    cost: 15000,
    baseItems: ['item_desolator', 'item_dodo_desolator'],
  },
  item_sacred_six_vein: {
    name: 'item_sacred_six_vein',
    nameCN: '六脉神剑',
    tier: ItemTier.T4,
    cost: 15600,
    baseItems: [
      'item_kaya',
      'item_kaya_and_sange',
      'item_sacred_trident',
      'item_sange',
      'item_sange_and_yasha',
      'item_yasha',
      'item_yasha_and_kaya',
    ],
  },
  item_jump_jump_jump: {
    name: 'item_jump_jump_jump',
    nameCN: '跳！跳！跳！刀',
    tier: ItemTier.T4,
    cost: 15650,
    // 可以有多个前置：overwhelming_blink_2, arcane_blink, swift_blink_2，选择其中一个作为主要前置
    baseItems: [
      'item_arcane_blink',
      'item_arcane_blink_2',
      'item_blink',
      'item_overwhelming_blink',
      'item_overwhelming_blink_2',
      'item_swift_blink',
      'item_swift_blink_2',
    ],
  },
  item_necronomicon_staff: {
    name: 'item_necronomicon_staff',
    nameCN: '死灵法杖',
    tier: ItemTier.T4,
    cost: 13000,
    baseItems: ['item_sheepstick'],
  },
  item_force_field_ultra: {
    name: 'item_force_field_ultra',
    nameCN: '神器·天地同寿甲',
    tier: ItemTier.T4,
    cost: 16600,
  },
  item_blue_fantasy: {
    name: 'item_blue_fantasy',
    nameCN: '苍蓝幻想',
    tier: ItemTier.T4,
    cost: 16700,
  },
  item_hallowed_scepter: {
    name: 'item_hallowed_scepter',
    nameCN: '仙云法杖',
    tier: ItemTier.T4,
    cost: 15800,
    baseItems: ['item_kaya', 'item_magic_scepter'],
  },
  item_refresh_core: {
    name: 'item_refresh_core',
    nameCN: '熔火核心',
    tier: ItemTier.T4,
    cost: 19900,
    baseItems: [
      'item_aether_lens_2',
      'item_arcane_octarine_core',
      'item_octarine_core',
      'item_refresher',
    ],
  },
  item_guardian_greaves_artifact: {
    name: 'item_guardian_greaves_artifact',
    nameCN: '神器·卫士胫甲',
    tier: ItemTier.T4,
    cost: 16800,
    baseItems: ['item_guardian_greaves'],
  },
  item_tome_of_agility: {
    name: 'item_tome_of_agility',
    nameCN: '敏捷之书',
    tier: ItemTier.T4,
    cost: 19999,
  },
  item_tome_of_intelligence: {
    name: 'item_tome_of_intelligence',
    nameCN: '智力之书',
    tier: ItemTier.T4,
    cost: 19999,
  },
  item_tome_of_strength: {
    name: 'item_tome_of_strength',
    nameCN: '力量之书',
    tier: ItemTier.T4,
    cost: 19999,
  },
  item_wasp_golden: {
    name: 'item_wasp_golden',
    nameCN: '黄金大核荣耀',
    tier: ItemTier.T4,
    cost: 20000,
    baseItems: ['item_butterfly', 'item_wasp_callous', 'item_wasp_despotic'],
  },
  item_excalibur: {
    name: 'item_excalibur',
    nameCN: 'EX咖喱棒',
    tier: ItemTier.T4,
    cost: 24000,
    baseItems: ['item_monkey_king_bar_2', 'item_rapier'],
  },

  // ===== T5: 终极装备 (>=30000金) =====

  item_six_paths_reincarnation_gun: {
    name: 'item_six_paths_reincarnation_gun',
    nameCN: '六道轮回枪',
    tier: ItemTier.T5,
    cost: 30000,
    baseItems: ['item_shotgun_v2', 'item_revenants_brooch_ultra', 'item_mage_slayer'],
  },
  item_hawkeye_fighter: {
    name: 'item_hawkeye_fighter',
    nameCN: '鹰眼战机',
    tier: ItemTier.T5,
    cost: 56349,
  },
  item_shadow_judgment: {
    name: 'item_shadow_judgment',
    nameCN: '暗影裁决',
    tier: ItemTier.T5,
    cost: 47175,
    baseItems: ['item_abyssal_blade_v2'],
  },
  item_dracula_mask: {
    name: 'item_dracula_mask',
    nameCN: '生命之盔',
    tier: ItemTier.T5,
    cost: 57449,
  },
  item_forbidden_staff: {
    name: 'item_forbidden_staff',
    nameCN: '禁忌法锤',
    tier: ItemTier.T5,
    cost: 58449,
  },
  item_tome_of_luoshu: {
    name: 'item_tome_of_luoshu',
    nameCN: '洛书',
    tier: ItemTier.T5,
    cost: 60000,
  },
  item_rapier_ultra_bot_1: {
    name: 'item_rapier_ultra_bot_1',
    nameCN: '解放的诅咒圣剑',
    tier: ItemTier.T5,
    cost: 48000,
    baseItems: ['item_excalibur', 'item_rapier'],
  },
  item_swift_glove: {
    name: 'item_swift_glove',
    nameCN: '无限手套',
    tier: ItemTier.T5,
    cost: 47300,
  },
  item_forbidden_blade: {
    name: 'item_forbidden_blade',
    nameCN: '禁忌战刃',
    tier: ItemTier.T5,
    cost: 62544,
  },
  item_shadow_impact: {
    name: 'item_shadow_impact',
    nameCN: '暗影法杖',
    tier: ItemTier.T5,
    cost: 40400,
  },
  item_hawkeye_turret: {
    name: 'item_hawkeye_turret',
    nameCN: '鹰眼炮台',
    tier: ItemTier.T5,
    cost: 65299,
  },
  item_withered_spring: {
    name: 'item_withered_spring',
    nameCN: '生命之心',
    tier: ItemTier.T5,
    cost: 52600,
    baseItems: ['item_undying_heart'],
  },
  item_magic_crit_blade: {
    name: 'item_magic_crit_blade',
    nameCN: '魔龙狂舞',
    tier: ItemTier.T5,
    cost: 43800,
    baseItems: ['item_hallowed_scepter'],
  },
  item_beast_armor: {
    name: 'item_beast_armor',
    nameCN: '兽化甲',
    tier: ItemTier.T5,
    cost: 56000,
  },
  item_magic_sword: {
    name: 'item_magic_sword',
    nameCN: '魔渊剑',
    tier: ItemTier.T5,
    cost: 59000,
    baseItems: ['item_bfury_ultra', 'item_infernal_desolator', 'item_skadi_2'],
  },
  item_beast_shield: {
    name: 'item_beast_shield',
    nameCN: '兽化盾',
    tier: ItemTier.T5,
    cost: 57300,
    baseItems: ['item_black_king_bar_2'],
  },
  item_time_gem: {
    name: 'item_time_gem',
    nameCN: '时间宝石',
    tier: ItemTier.T5,
    cost: 67900,
    baseItems: ['item_refresh_core'],
  },
  item_switchable_crit_blade: {
    name: 'item_switchable_crit_blade',
    nameCN: '归海一刀',
    tier: ItemTier.T5,
    cost: 54000,
  },
  item_ten_thousand_swords: {
    name: 'item_ten_thousand_swords',
    nameCN: '万剑归宗',
    tier: ItemTier.T5,
    cost: 67600,
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
 * 基于 baseItems 边做传递闭包，得到每件装备替代的全部下位装备（材料链任意深度）
 * 传入 config 便于单测注入小型 fixture，不依赖完整 ItemTierConfig
 */
export function BuildItemReplaceMap(config: Record<string, ItemConfig>): Map<string, string[]> {
  const replaceMap = new Map<string, string[]>();

  function collectDescendants(itemName: string, visited: Set<string>): string[] {
    const baseItems = config[itemName]?.baseItems;
    if (!baseItems) return [];

    const result: string[] = [];
    for (const baseItem of baseItems) {
      if (visited.has(baseItem)) continue;
      visited.add(baseItem);
      result.push(baseItem);
      result.push(...collectDescendants(baseItem, visited));
    }
    return result;
  }

  for (const itemName in config) {
    const descendants = collectDescendants(itemName, new Set());
    if (descendants.length > 0) {
      replaceMap.set(itemName, descendants);
    }
  }

  return replaceMap;
}

let ItemReplaceMap: Map<string, string[]> = new Map();

/**
 * 初始化装备替代关系（游戏开始时调用一次）
 */
export function InitializeItemReplaceMap(): void {
  print('[AI] InitializeItemReplaceMap 初始化装备替代关系');
  ItemReplaceMap = BuildItemReplaceMap(ItemTierConfig);
}

/**
 * 获取拥有该装备时可以出售的全部下位装备
 * @param itemName 装备名称
 * @returns 被替代的下位装备列表
 */
export function GetReplacedItems(itemName: string): string[] {
  return ItemReplaceMap.get(itemName) ?? [];
}
