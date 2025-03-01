import { Tier } from './tier';

/**
 * 技能抽选概率，Tier 5-1
 * 确保概率从低到高排列
 */
export const abilityTiersActive: Tier[] = [
  {
    level: 5,
    rate: 1,
    names: [
      // 主动技能
      // 大招
      'enigma_black_hole', // 黑洞
      'abaddon_borrowed_time', // 回光返照

      // 小技能
      'gyrocopter_flak_cannon', // 高射火炮
      // 法球/开关技能
      'medusa_split_shot', // 分裂箭
      'winter_wyvern_arctic_burn', // 严寒灼烧
    ],
  },
  {
    level: 4,
    rate: 5,
    names: [
      // 5级候补
      'bounty_hunter_track', // 追踪术
      // 主动技能
      // 大招
      'dazzle_good_juju', // 善咒
      'juggernaut_omni_slash', // 无敌斩
      'doom_bringer_doom', // 末日
      'sven_gods_strength', // 神之力量

      // 小技能
      'ember_spirit_sleight_of_fist', // 无影拳

      // 法球/开关技能
      'omniknight_hammer_of_purity', // 纯洁之锤
      'silencer_glaives_of_wisdom', // 智慧之刃
    ],
  },
  {
    level: 3,
    rate: 20,
    names: [
      // 主动技能
      // 大招
      'lion_finger_of_death', // 死亡一指
      'shadow_shaman_mass_serpent_ward', // 群蛇守卫
      'necrolyte_reapers_scythe', // 死神镰刀
      'storm_spirit_ball_lightning', // 球状闪电
      'slark_shadow_dance', // 暗影之舞
      'brewmaster_primal_split_lua', // 元素分离 改
      'alchemist_chemical_rage', // 化学狂暴
      'medusa_stone_gaze', // 石化凝视
      'axe_culling_blade', // 淘汰之刃
      'bloodseeker_rupture', // 割裂
      'tidehunter_ravage', // 毁灭
      'faceless_void_time_zone', // 逆转时空
      'silencer_global_silence', // 全领域禁默
      'earthshaker_echo_slam', // 回音击

      // 小技能
      'dark_willow_shadow_realm', // 暗影之境
      'bloodseeker_bloodrage', // 血怒
      'dark_seer_vacuum', // 真空
      'witch_doctor_paralyzing_cask', // 麻痹药剂

      // 法球/开关技能
      'doom_bringer_infernal_blade', // 阎刃
      'ancient_apparition_chilling_touch', // 极寒之触

      // 自定义技能
      'dazzle_rain_of_vermin', // 诅咒之雨
      'clinkz_burning_barrage2', // 炽烈火雨
      'ancient_apparition_freezing_aura', // 极寒光环
    ],
  },
  {
    level: 2,
    rate: 60,
    names: [
      // 主动技能
      // 大招
      'tinker_rearm_lua', // 再装填
      'omniknight_guardian_angel', // 守护天使
      'winter_wyvern_winters_curse', // 寒冬诅咒
      'weaver_time_lapse', // 时光倒流
      'queenofpain_sonic_wave', // 超声冲击波
      'witch_doctor_death_ward', // 死亡守卫
      'skywrath_mage_mystic_flare', // 神秘之耀
      'kunkka_ghostship', // 幽灵船
      'slardar_amplify_damage', // 侵蚀雾霭 点灯
      'legion_commander_duel', // 决斗

      // 小技能
      'pudge_meat_hook', // 肉钩
      'sniper_shrapnel', // 霰弹雨
      'bounty_hunter_wind_walk', // 暗影步
      'lion_impale', // 裂地尖刺
      'sandking_burrowstrike', // 穿刺 沙王
      'sven_storm_bolt', // 风暴之拳 斯温
      'dark_willow_bramble_maze', // 荆棘迷宫
      'kunkka_torrent', // 洪流
      'lina_light_strike_array', // 光击阵
      'slardar_slithereen_crush', // 鱼人碎击
      'omniknight_repel', // 咸鱼恩赐
      'mars_bulwark', // 护身甲盾
      'earthshaker_enchant_totem', // 强化图腾

      // 法球/开关技能
      'viper_poison_attack', // 毒性攻击
      'drow_ranger_frost_arrows', // 霜冻之箭

      // 自定义技能
      // 'alchemist_berserk_potion2', // 狂暴药剂 new
      'ancient_apparition_frost_seal', // 冰霜封印
      // 'abyssal_underlord_charge_slash', // 冲锋斩
    ],
  },
  {
    level: 1,
    rate: 100,
    names: [
      // 主动技能
      // 大招
      'pangolier_gyroshell', // 地雷滚滚
      'lina_laguna_blade', // 神灭斩
      'sniper_assassinate', // 暗杀
      'sandking_epicenter', // 地震
      'techies_land_mines', // 感应地雷

      // 小技能
      'tidehunter_kraken_shell', // 海妖外壳
      'antimage_blink', // 闪烁
      'spirit_breaker_charge_of_darkness', // 暗影冲刺
      'earthshaker_fissure', // 沟壑
      'alchemist_acid_spray', // 酸雾
      'treant_living_armor', // 活体护甲
      'witch_doctor_maledict', // 诅咒
      'phantom_assassin_phantom_strike', // 幻影突袭
      'tinker_laser', // 激光
      'phantom_assassin_stifling_dagger', // 窒碍短匕
      'dark_seer_ion_shell', // 离子外壳
      'mirana_arrow', // 月神之箭
      'lina_dragon_slave', // 龙破斩
      'rattletrap_rocket_flare', // 照明火箭
      'tinker_heat_seeking_missile', // 热导飞弹
      'medusa_mystic_snake', // 秘术异蛇
      'drow_ranger_multishot', // 数箭齐发
      'ancient_apparition_ice_vortex', // 冰霜漩涡
      'axe_berserkers_call', // 狂战士之吼
      'bloodseeker_blood_bath', // 血祭
      'shadow_shaman_voodoo', // 妖术

      // 法球/开关技能
      'enchantress_impetus', // 推进

      // 自定义技能
      'arc_warden_scepter', // 人工神符
    ],
  },
];

export const abilityTiersPassive: Tier[] = [
  {
    level: 5,
    rate: 1,
    names: [
      // 被动技能
      'elder_titan_natural_order', // 自然秩序
      'muerta_gunslinger', // 神枪在手
      'slark_essence_shift', // 能量转移
      'phantom_assassin_coup_de_grace', // 恩赐解脱
    ],
  },
  {
    level: 4,
    rate: 5,
    names: [
      // 5级候补
      'centaur_return', // 人马 反伤
      'earthshaker_aftershock', // 余震
      'brewmaster_drunken_brawler', // 醉拳
      'nevermore_dark_lord', // 魔王降临
      // 被动技能
      'sven_great_cleave', // 巨力挥舞
      'templar_assassin_psi_blades', // 灵能之刃
      'ursa_fury_swipes', // 怒意狂击
      'faceless_void_time_lock', // 时间锁定
      'luna_moon_glaive', // 月刃
      'slardar_bash', // 深海重击
      'juggernaut_blade_dance', // 剑舞
      'shredder_reactive_armor', // 活性活甲
      'dawnbreaker_luminosity', // 熠熠生辉
      'chaos_knight_chaos_strike', // 混沌一击
      'vengefulspirit_command_aura', // 复仇光环

      // 自定义技能
      'dark_seer_normal_punch2', // 普通一拳
      'alchemist_enhanced_weaponry', // 强化武器
      'viper_universal_hero', // 全才
      'sven_wrath_of_god2', // 斯文 神之愤怒
    ],
  },
  {
    level: 3,
    rate: 20,
    names: [
      // 被动技能
      'drow_ranger_marksmanship', // 射手天赋
      'kunkka_tidebringer', // 潮汐使者 水刀
      'rubick_arcane_supremacy', // 奥术至尊
      'axe_counter_helix', // 反击螺旋
      'bloodseeker_thirst', // 焦渴
      'riki_permanent_invisibility', // 永久隐身（旧版）
      'necrolyte_heartstopper_aura', // 竭心光环
      'enchantress_untouchable', // 不可侵犯
      'monkey_king_jingu_mastery', // 如意棒法
      'weaver_geminate_attack', // 连击
      'lina_fiery_soul', // 炽魂
      'spectre_desolate', // 荒芜
      'brewmaster_fire_phase', // 永久相位

      // 自定义技能
      'ogre_magi_multicast_lua', // 多重施法
      'jakiro_double_trouble2', // 双头龙 天生一对
      'dragon_knight_inherited_vigor2', // 龙骑 先天 龙血

      'abyssal_underlord_firestorm2', // 火雨降临
      'crystal_maiden_ice_explosion', // 冰女 冰暴
    ],
  },
  {
    level: 2,
    rate: 60,
    names: [
      // 被动技能
      'skeleton_king_mortal_strike', // 本命一击
      'huskar_berserkers_blood', // 狂战士之血
      'legion_commander_moment_of_courage', // 勇气之霎
      'abyssal_underlord_atrophy_aura', // 衰退光环
      'obsidian_destroyer_equilibrium', // 精华变迁
      'spirit_breaker_greater_bash', // 巨力重击
      'antimage_mana_break', // 法力损毁
      'abaddon_frostmourne', // 魔霭诅咒
      'sniper_headshot', // 爆头

      // 自定义技能
      'batrider_smoldering_resin2', // 蝙蝠骑士 树脂
      'ursa_maul2', // 拍拍 天生技能 +攻击
      'abyssal_underlord_malice_aura', // 怨念光环
      'ancient_apparition_frost_orb', // 冰霜法球
      'alchemist_goblins_greed2', // 贪婪
      'bounty_hunter_cutpurse2', // 赏金 妙手空空 技能偷钱
      'dark_seer_quick_wit2', // 才思敏捷
    ],
  },
  {
    level: 1,
    rate: 100,
    names: [
      // 被动技能
      'bounty_hunter_jinada', // 忍术
      'lycan_feral_impulse', // 野性驱使
      'razor_storm_surge', // 风暴涌动
      'venomancer_poison_sting', // 剧毒术士 毒刺
      'tiny_grow', // 长大
      'night_stalker_hunter_in_the_night', // 暗夜猎影
      'troll_warlord_fervor', // 热血战魂
      'storm_spirit_overload', // 超负荷
      'visage_gravekeepers_cloak', // 陵卫斗篷
      'life_stealer_ghoul_frenzy', // 尸鬼狂怒
      'viper_corrosive_skin', // 腐蚀皮肤
      'rubick_null_field', // 失效立场
      'pangolier_lucky_shot', // 幸运一击
      'crystal_maiden_brilliance_aura', // 奥术光环 冰女
      'alchemist_corrosive_weaponry', // 腐蚀兵械

      // 自定义技能
      'spectre_dispersion2', // 幽鬼 折射 旧版
      'centaur_rawhide2', // 人马 皮糙肉厚
      'axe_one_man_army2', // 斧王 一人成军
    ],
  },
];
