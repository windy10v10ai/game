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
      'juggernaut_omni_slash', // 无敌斩

      // 法球/开关技能
      'omniknight_hammer_of_purity', // 纯洁之锤

      // 被动技能
      'elder_titan_natural_order', // 自然秩序
      'phantom_assassin_coup_de_grace', // 恩赐解脱
      'templar_assassin_psi_blades', // 灵能之刃
    ],
  },
  {
    level: 4,
    rate: 5,
    names: [
      // 主动技能
      // 大招
      'abaddon_borrowed_time', // 回光返照
      'necrolyte_reapers_scythe', // 死神镰刀
      'doom_bringer_doom', // 末日
      'lion_finger_of_death', // 死亡一指
      'shadow_shaman_mass_serpent_ward', // 群蛇守卫
      'oracle_false_promise', // 虚妄之诺

      // 小技能
      'shredder_whirling_death', // 死亡旋风

      // 法球/开关技能
      'gyrocopter_flak_cannon', // 高射火炮
      'enchantress_impetus', // 推进
      'medusa_split_shot', // 分裂箭

      // 被动技能
      'muerta_gunslinger', // 神枪在手
      'drow_ranger_marksmanship', // 射手天赋
      'dazzle_good_juju', // 善咒
      'sven_great_cleave', // 巨力挥舞
      'ursa_fury_swipes', // 怒意狂击
      'faceless_void_time_lock', // 时间锁定
      'luna_moon_glaive', // 月刃
      'kunkka_tidebringer', // 潮汐使者 水刀
    ],
  },
  {
    level: 3,
    rate: 20,
    names: [
      // 主动技能
      // 大招
      'storm_spirit_ball_lightning', // 球状闪电
      'sven_gods_strength', // 神之力量
      'queenofpain_sonic_wave', // 超声冲击波
      'lina_laguna_blade', // 神灭斩
      'slark_shadow_dance', // 暗影之舞
      'brewmaster_primal_split_lua', // 元素分离 改
      'sniper_assassinate', // 暗杀
      'alchemist_chemical_rage', // 化学狂暴
      'phoenix_supernova', // 超新星
      'tidehunter_ravage', // 毁灭
      'weaver_time_lapse', // 时光倒流

      // 小技能
      'pudge_meat_hook', // 肉钩
      'shadow_shaman_voodoo', // 妖术
      'dark_willow_shadow_realm', // 暗影之境
      'witch_doctor_maledict', // 诅咒

      // 法球/开关技能
      'doom_bringer_infernal_blade', // 阎刃
      'silencer_glaives_of_wisdom', // 智慧之刃
      'ancient_apparition_chilling_touch', // 极寒之触
      'winter_wyvern_arctic_burn', // 严寒灼烧

      // 被动技能
      'rubick_arcane_supremacy', // 奥术至尊
      'troll_warlord_fervor', // 热血战魂
      'huskar_berserkers_blood', // 狂战士之血
      'slark_essence_shift', // 能量转移
      'chaos_knight_chaos_strike', // 混沌一击
      'axe_counter_helix', // 反击螺旋
      'bloodseeker_thirst', // 焦渴
      'riki_permanent_invisibility', // 永久隐身（旧版）
      'slardar_bash', // 深海重击
      'vengefulspirit_command_aura', // 复仇光环
      'necrolyte_heartstopper_aura', // 竭心光环
      'enchantress_untouchable', // 不可侵犯
      'earthshaker_aftershock', // 余震
      'juggernaut_blade_dance', // 剑舞
      'skeleton_king_mortal_strike', // 本命一击
      'monkey_king_jingu_mastery', // 如意棒法
    ],
  },
  {
    level: 2,
    rate: 60,
    names: [
      // 主动技能
      // 大招
      'rattletrap_hookshot', // 发射钩爪
      'bane_fiends_grip', // 魔爪
      'witch_doctor_death_ward', // 死亡守卫
      'omniknight_guardian_angel', // 守护天使
      'sandking_epicenter', // 地震
      'winter_wyvern_winters_curse', // 寒冬诅咒

      // 小技能
      'legion_commander_press_the_attack', // 强攻
      'nyx_assassin_mana_burn', // 法力燃烧
      'skywrath_mage_mystic_flare', // 神秘之耀
      'antimage_blink', // 闪烁
      'razor_static_link', // 静电连接
      'bane_brain_sap', // 蚀脑
      'spirit_breaker_charge_of_darkness', // 暗影冲刺
      'sniper_shrapnel', // 霰弹雨
      'bounty_hunter_wind_walk', // 暗影步
      'lion_impale', // 裂地尖刺
      'sandking_burrowstrike', // 穿刺 沙王
      'alchemist_acid_spray', // 酸雾
      'sven_storm_bolt', // 风暴之拳 斯温
      'treant_living_armor', // 活体护甲
      'legion_commander_overwhelming_odds', // 压倒性优势
      'oracle_fates_edict', // 命运敕令
      'witch_doctor_paralyzing_cask', // 麻痹药剂
      'phantom_assassin_phantom_strike', // 幻影突袭
      'slardar_slithereen_crush', // 鱼人碎击

      // 法球/开关技能
      'viper_poison_attack', // 毒性攻击
      'drow_ranger_frost_arrows', // 霜冻之箭

      // 被动技能
      'weaver_geminate_attack', // 连击
      'obsidian_destroyer_equilibrium', // 精华变迁
      'tiny_grow', // 长大
      'spirit_breaker_greater_bash', // 巨力重击
      'antimage_mana_break', // 法力损毁
      'bounty_hunter_jinada', // 忍术
      'abaddon_frostmourne', // 魔霭诅咒
      'abyssal_underlord_atrophy_aura', // 衰退光环
      'night_stalker_hunter_in_the_night', // 暗夜猎影
      'nevermore_dark_lord', // 魔王降临
      'dawnbreaker_luminosity', // 熠熠生辉
      'lina_fiery_soul', // 炽魂
      'mars_bulwark', // 护身甲盾
      'lycan_feral_impulse', // 野性驱使
      'spectre_desolate', // 荒芜
      'centaur_return', // 人马 反伤
      'storm_spirit_overload', // 超负荷
      'shredder_reactive_armor', // 活性活甲
      'brewmaster_fire_phase', // 永久相位
      'razor_storm_surge', // 风暴涌动
      'sniper_headshot', // 爆头
      'tidehunter_kraken_shell', // 海妖外壳
      'venomancer_poison_sting', // 剧毒术士 毒刺
    ],
  },
  {
    level: 1,
    rate: 100,
    names: [
      // 主动技能
      // 大招
      'dark_willow_bedlam', // 作祟

      // 小技能
      'winter_wyvern_cold_embrace', // 极寒之拥 冰箱
      'oracle_purifying_flames', // 涤罪之焰
      'tinker_laser', // 激光
      'earthshaker_fissure', // 沟壑
      'phantom_assassin_stifling_dagger', // 窒碍短匕
      'dark_willow_bramble_maze', // 荆棘迷宫
      'lina_light_strike_array', // 光击阵
      'ogre_magi_fireblast', // 火焰爆轰
      'skywrath_mage_arcane_bolt', // 奥术鹰隼
      'omniknight_repel', // 咸鱼恩赐
      'dark_seer_ion_shell', // 离子外壳
      'dark_seer_vacuum', // 真空
      'mirana_arrow', // 月神之箭
      'kunkka_torrent', // 洪流
      'lina_dragon_slave', // 龙破斩
      'visage_soul_assumption', // 灵魂超度
      'rattletrap_rocket_flare', // 照明火箭
      'tinker_defense_matrix', // 防御矩阵

      // 法球/开关技能
      // 'witch_doctor_voodoo_restoration', // 巫毒疗法
      // 'jakiro_liquid_fire', // 液态火
      // 'jakiro_liquid_ice', // 液态冰
      // 'obsidian_destroyer_arcane_orb', // 奥术天球

      // 被动技能
      'legion_commander_moment_of_courage', // 勇气之霎
      'visage_gravekeepers_cloak', // 陵卫斗篷
      'life_stealer_ghoul_frenzy', // 尸鬼狂怒
      'broodmother_incapacitating_bite', // 麻痹之咬
      'viper_corrosive_skin', // 腐蚀皮肤
      'rubick_null_field', // 失效立场
      'pangolier_lucky_shot', // 幸运一击
      'crystal_maiden_brilliance_aura', // 奥术光环 冰女
      'alchemist_corrosive_weaponry', // 腐蚀兵械

      // 选择率较低 但胜率还可以的技能暂时移除
      // 'skywrath_mage_ancient_seal', // 上古封印
      // 'omniknight_purification', // 洗礼
      // 'tusk_ice_shards', // 寒冰碎片
    ],
  },
];
