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
      // 主动技能
      // 大招
      'enigma_black_hole', // 黑洞
      'necrolyte_reapers_scythe', // 死神镰刀

      // 法球/开关技能
      'abaddon_borrowed_time', // 回光返照

      // 被动技能
      'elder_titan_natural_order', // 自然秩序
      // 'spectre_dispersion', // 折射
    ],
  },
  {
    level: 4,
    rate: 5,
    names: [
      // 主动技能
      // 大招
      'juggernaut_omni_slash', // 无敌斩
      'omniknight_guardian_angel', // 守护天使
      'doom_bringer_doom', // 末日
      'lina_laguna_blade', // 神灭斩
      'lion_finger_of_death', // 死亡一指
      'storm_spirit_ball_lightning', // 球状闪电
      'queenofpain_sonic_wave', // 超声冲击波
      'winter_wyvern_winters_curse', // 寒冬诅咒
      'sven_gods_strength', // 神之力量

      // 法球/开关技能
      'doom_bringer_infernal_blade', // 阎刃
      'enchantress_impetus', // 推进
      'omniknight_hammer_of_purity', // 纯洁之锤

      // 被动技能
      'drow_ranger_marksmanship', // 射手天赋
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
      // 主动技能
      // 大招
      'slark_shadow_dance', // 暗影之舞
      'brewmaster_primal_split_lua', // 元素分离 改
      'sniper_assassinate', // 暗杀
      'sandking_epicenter', // 地震
      'skywrath_mage_mystic_flare', // 神秘之耀
      'bane_fiends_grip', // 魔爪
      'alchemist_chemical_rage', // 化学狂暴

      // 小技能
      'tiny_tree_grab', // 抓树
      'nyx_assassin_mana_burn', // 法力燃烧
      'faceless_void_time_walk', // 时间漫游
      'pudge_meat_hook', // 肉钩
      'shredder_whirling_death', // 死亡旋风
      'tinker_laser', // 激光

      // 法球/开关技能
      'silencer_glaives_of_wisdom', // 智慧之刃
      'ancient_apparition_chilling_touch', // 极寒之触
      'gyrocopter_flak_cannon', // 高射火炮
      'winter_wyvern_arctic_burn', // 严寒灼烧

      // 被动技能
      'troll_warlord_fervor', // 热血战魂
      'huskar_berserkers_blood', // 狂战士之血
      'slark_essence_shift', // 能量转移
      'chaos_knight_chaos_strike', // 混沌一击
      'axe_counter_helix', // 反击螺旋
      'bloodseeker_thirst', // 焦渴
      'riki_permanent_invisibility', // 永久隐身（旧版）
      'slardar_bash', // 深海重击
      'kunkka_tidebringer', // 潮汐使者 水刀
      'muerta_gunslinger', // 神枪在手
      'vengefulspirit_command_aura', // 复仇光环
      'necrolyte_heartstopper_aura', // 竭心光环
      'enchantress_untouchable', // 不可侵犯
      'earthshaker_aftershock', // 余震
      // 'bristleback_bristleback', // 钢毛后背
      // 'ogre_magi_multicast', // 多重施法
    ],
  },
  {
    level: 2,
    rate: 60,
    names: [
      // 主动技能
      // 大招
      'rattletrap_hookshot', // 发射钩爪

      // 小技能
      'antimage_blink', // 闪烁
      'razor_static_link', // 静电连接
      'bane_brain_sap', // 蚀脑
      'shadow_shaman_voodoo', // 妖术
      'earthshaker_fissure', // 沟壑
      'omniknight_purification', // 洗礼
      'spirit_breaker_charge_of_darkness', // 暗影冲刺
      'ogre_magi_fireblast', // 火焰爆轰
      'sniper_shrapnel', // 霰弹雨
      'phantom_assassin_stifling_dagger', // 窒碍短匕
      'bounty_hunter_wind_walk', // 暗影步
      'lina_light_strike_array', // 光击阵
      'lion_impale', // 裂地尖刺
      'sandking_burrowstrike', // 穿刺 沙王
      'alchemist_acid_spray', // 酸雾
      'winter_wyvern_cold_embrace', // 极寒之拥 冰箱
      'sven_storm_bolt', // 风暴之拳 斯温

      // 法球/开关技能
      'viper_poison_attack', // 毒性攻击

      // 被动技能
      'weaver_geminate_attack', // 连击
      'obsidian_destroyer_equilibrium', // 精华变迁
      'tiny_grow', // 长大
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
      'spectre_desolate', // 荒芜
      'centaur_return', // 人马 反伤
    ],
  },
  {
    level: 1,
    rate: 100,
    names: [
      // 主动技能
      // 小技能
      'tusk_ice_shards', // 寒冰碎片
      'skywrath_mage_arcane_bolt', // 奥术鹰隼
      'omniknight_repel', // 咸鱼恩赐
      'dark_seer_ion_shell', // 离子外壳
      'dark_seer_vacuum', // 真空
      'tusk_snowball', // 雪球
      'ogre_magi_ignite', // 引燃
      'shadow_shaman_ether_shock', // 苍穹震击
      'phantom_assassin_phantom_strike', // 幻影突袭
      'mirana_arrow', // 月神之箭
      'kunkka_torrent', // 洪流
      'lina_dragon_slave', // 龙破斩
      'visage_soul_assumption', // 灵魂超度
      'necrolyte_death_pulse', // 死亡脉冲
      'slardar_slithereen_crush', // 鱼人碎击
      'rattletrap_rocket_flare', // 照明火箭
      'skywrath_mage_ancient_seal', // 上古封印
      'tinker_defense_matrix', // 防御矩阵
      // 'bounty_hunter_shuriken_toss', // 投掷飞镖
      // 'keeper_of_the_light_mana_leak', // 法力流失

      // 法球/开关技能
      'drow_ranger_frost_arrows', // 霜冻之箭
      // 'witch_doctor_voodoo_restoration', // 巫毒疗法
      // 'jakiro_liquid_fire', // 液态火
      // 'jakiro_liquid_ice', // 液态冰
      // 'obsidian_destroyer_arcane_orb', // 奥术天球

      // 被动技能
      'legion_commander_moment_of_courage', // 勇气之霎
      'sniper_headshot', // 爆头
      'visage_gravekeepers_cloak', // 陵卫斗篷
      'life_stealer_ghoul_frenzy', // 尸鬼狂怒
      'venomancer_poison_sting', // 剧毒术士 毒刺
      'broodmother_incapacitating_bite', // 麻痹之咬
      'shredder_reactive_armor', // 活性活甲
      'viper_corrosive_skin', // 腐蚀皮肤
      'rubick_null_field', // 失效立场
      'brewmaster_fire_phase', // 永久相位
      'pangolier_lucky_shot', // 幸运一击
      'razor_storm_surge', // 风暴涌动
      'crystal_maiden_brilliance_aura', // 奥术光环 冰女
      'tidehunter_kraken_shell', // 海妖外壳
      'storm_spirit_overload', // 超负荷
      // 'alchemist_corrosive_weaponry', // 腐蚀兵械
    ],
  },
];
