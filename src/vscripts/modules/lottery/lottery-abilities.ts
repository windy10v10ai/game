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
      // 法球/开关技能
      'abaddon_borrowed_time', // 回光返照

      // 被动技能
      'omniknight_hammer_of_purity', // 纯洁之锤
      'elder_titan_natural_order', // 自然秩序
      // 'spectre_dispersion', // 折射
      'drow_ranger_marksmanship', // 射手天赋
    ],
  },
  {
    level: 4,
    rate: 5,
    names: [
      // 法球/开关技能
      'doom_bringer_infernal_blade', // 阎刃
      'enchantress_impetus', // 推进

      // 被动技能
      'bristleback_bristleback', // 钢毛后背
      'phantom_assassin_coup_de_grace', // 恩赐解脱
      'templar_assassin_psi_blades', // 灵能之刃
      'dazzle_good_juju', // 善咒
      'rubick_arcane_supremacy', // 奥术至尊
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
      // 法球/开关技能
      'obsidian_destroyer_arcane_orb', // 奥术天球
      'silencer_glaives_of_wisdom', // 智慧之刃
      'ancient_apparition_chilling_touch', // 极寒之触
      'gyrocopter_flak_cannon', // 高射火炮

      // 被动技能
      'troll_warlord_fervor', // 热血战魂
      // 'ogre_magi_multicast', // 多重施法
      'huskar_berserkers_blood', // 狂战士之血
      'slark_essence_shift', // 能量转移
      'chaos_knight_chaos_strike', // 混沌一击
      'axe_counter_helix', // 反击螺旋
      'bloodseeker_thirst', // 焦渴
      'legion_commander_moment_of_courage', // 勇气之霎
      'riki_permanent_invisibility', // 永久隐身（旧版）
      'slardar_bash', // 深海重击
      'kunkka_tidebringer', // 潮汐使者 水刀
      'muerta_gunslinger', // 神枪在手
      'vengefulspirit_command_aura', // 复仇光环
      'necrolyte_heartstopper_aura', // 竭心光环
      'enchantress_untouchable', // 不可侵犯
      'earthshaker_aftershock', // 余震
    ],
  },
  {
    level: 2,
    rate: 50,
    names: [
      // 法球/开关技能
      'viper_poison_attack', // 毒性攻击

      // 被动技能
      'centaur_return', // 人马 反伤
      'obsidian_destroyer_equilibrium', // 精华变迁
      'tiny_grow', // 长大
      'spectre_desolate', // 荒芜
      'monkey_king_jingu_mastery', // 如意棒法
      'spirit_breaker_greater_bash', // 巨力重击
      'antimage_mana_break', // 法力损毁
      'bounty_hunter_jinada', // 忍术
      'abaddon_frostmourne', // 魔霭诅咒
      'abyssal_underlord_atrophy_aura', // 衰退光环
      'juggernaut_blade_dance', // 剑舞
      'skeleton_king_mortal_strike', // 本命一击
      'night_stalker_hunter_in_the_night', // 暗夜猎影
      'nevermore_dark_lord', // 魔王降临
      'dawnbreaker_luminosity', // 熠熠生辉
      'lina_fiery_soul', // 炽魂
      'mars_bulwark', // 护身甲盾
      'lycan_feral_impulse', // 野性驱使
      'weaver_geminate_attack', // 连击
    ],
  },
  {
    level: 1,
    rate: 100,
    names: [
      // 法球/开关技能
      'drow_ranger_frost_arrows', // 霜冻之箭
      'jakiro_liquid_fire', // 液态火
      'jakiro_liquid_ice', // 液态冰
      'witch_doctor_voodoo_restoration', // 巫毒疗法

      // 被动技能
      'sniper_headshot', // 爆头
      'alchemist_corrosive_weaponry', // 腐蚀兵械
      'visage_gravekeepers_cloak', // 陵卫斗篷
      'storm_spirit_overload', // 超负荷
      'life_stealer_ghoul_frenzy', // 尸鬼狂怒
      // 'venomancer_poison_sting', // 剧毒术士 毒刺
      'broodmother_incapacitating_bite', // 麻痹之咬
      'shredder_reactive_armor', // 活性活甲
      'viper_corrosive_skin', // 腐蚀皮肤
      'beastmaster_inner_beast', // 野性之心
      'rubick_null_field', // 失效立场
      'brewmaster_fire_phase', // 永久相位
      // 'brewmaster_fire_permanent_immolation', // 永久献祭
      // 'silencer_last_word', // 遗言
      'tidehunter_kraken_shell', // 海妖外壳
      'pangolier_lucky_shot', // 幸运一击
      'phantom_lancer_phantom_edge', // 幻影冲锋
      'razor_storm_surge', // 风暴涌动
      'lich_frost_aura', // 冰霜光环
      'crystal_maiden_brilliance_aura', // 奥术光环 冰女
    ],
  },
];
