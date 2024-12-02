import { Tier } from './tier';

/**
 * 技能抽选概率，Tier 5-1
 * 确保概率从低到高排列
 */
export const abilityTiers: Tier[] = [
  {
    level: 5,
    rate: 1,
    names: [
      'elder_titan_natural_order', // 自然秩序
      'bristleback_bristleback', // 钢毛后背
      'spectre_dispersion', // 折射
      'drow_ranger_marksmanship', // 射手天赋
      'ogre_magi_multicast', // 多重施法
    ],
  },
  {
    level: 4,
    rate: 5,
    names: [
      'phantom_assassin_coup_de_grace', // 恩赐解脱
      'huskar_berserkers_blood', // 狂战士之血
      'templar_assassin_psi_blades', // 灵能之刃
      'troll_warlord_fervor', // 热血战魂
      'dazzle_good_juju', // 善咒
      'rubick_arcane_supremacy', // 奥术至尊
      'slark_essence_shift', // 能量转移
      'sven_great_cleave', // 巨力挥舞
      'ursa_fury_swipes', // 怒意狂击
      'medusa_split_shot', // 分裂箭
      'faceless_void_time_lock', // 时间锁定
      'luna_moon_glaive', // 月刃
    ],
  },
  {
    level: 3,
    rate: 20,
    names: [
      'chaos_knight_chaos_strike', // 混沌一击
      'axe_counter_helix', // 反击螺旋
      'bloodseeker_thirst', // 焦渴
      'legion_commander_moment_of_courage', // 勇气之霎
      'centaur_return', // 人马 反伤
      'riki_permanent_invisibility', // 永久隐身（旧版）
      'lich_frost_aura', // 冰霜光环
      'spectre_desolate', // 荒芜
      'slardar_bash', // 深海重击
      'spirit_breaker_greater_bash', // 巨力重击
      'kunkka_tidebringer', // 潮汐使者 水刀
      'lycan_feral_impulse', // 野性驱使
      'muerta_gunslinger', // 神枪在手
      'vengefulspirit_command_aura', // 复仇光环
      'necrolyte_heartstopper_aura', // 竭心光环
      'enchantress_untouchable', // 不可侵犯
      'monkey_king_jingu_mastery', // 如意棒法
    ],
  },
  {
    level: 2,
    rate: 50,
    names: [
      'tiny_grow', // 长大
      'earthshaker_aftershock', // 余震
      'antimage_mana_break', // 法力损毁
      'bounty_hunter_jinada', // 忍术
      'abaddon_frostmourne', // 魔霭诅咒
      'abyssal_underlord_atrophy_aura', // 衰退光环
      'juggernaut_blade_dance', // 剑舞
      'skeleton_king_mortal_strike', // 本命一击
      'life_stealer_ghoul_frenzy', // 尸鬼狂怒
      'night_stalker_hunter_in_the_night', // 暗夜猎影
      'obsidian_destroyer_equilibrium', // 精华变迁
      'visage_gravekeepers_cloak', // 陵卫斗篷
      'alchemist_corrosive_weaponry', // 腐蚀兵械
      'sniper_headshot', // 爆头
      'nevermore_dark_lord', // 魔王降临
      'dawnbreaker_luminosity', // 熠熠生辉
      'weaver_geminate_attack', // 连击
      'lina_fiery_soul', // 炽魂
      'storm_spirit_overload', // 超负荷
    ],
  },
  {
    level: 1,
    rate: 100,
    names: [
      'venomancer_poison_sting', // 剧毒术士 毒刺
      'broodmother_poison_sting', // 蜘蛛 毒刺
      'broodmother_incapacitating_bite', // 麻痹之咬
      'shredder_reactive_armor', // 活性活甲
      'viper_corrosive_skin', // 腐蚀皮肤
      'beastmaster_inner_beast', // 野性之心
      'rubick_null_field', // 失效立场
      'brewmaster_fire_phase', // 永久相位
      'brewmaster_fire_permanent_immolation', // 永久献祭
      'silencer_last_word', // 遗言
      'tidehunter_kraken_shell', // 海妖外壳
      'crystal_maiden_brilliance_aura', // 奥术光环 冰女
      'pangolier_lucky_shot', // 幸运一击
      'phantom_lancer_phantom_edge', // 幻影冲锋
      'razor_storm_surge', // 风暴涌动
    ],
  },
];
