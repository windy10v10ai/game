import { Tier } from './tier';

/**
 * 技能列表，Tier 5-1
 * 确保概率从低到高排列
 */
export const abilityTiersActive: Tier[] = [
  {
    level: 5,
    names: [
      // 主动技能
      // 大招
      'enigma_black_hole', // 黑洞
      'faceless_void_time_zone', // 逆转时空
      'abaddon_borrowed_time', // 回光返照
      'alchemist_chemical_rage', // 化学狂暴
      // 小技能
      'gyrocopter_flak_cannon', // 高射火炮

      // 自定义技能
      // 'ability_mind_control', //夺舍
    ],
  },
  {
    level: 4,
    names: [
      // 主动技能
      // 大招
      'marci_unleash', // 怒拳破
      'juggernaut_omni_slash', // 无敌斩
      'sven_gods_strength', // 神之力量
      'legion_commander_duel', // 决斗
      'mars_bulwark', // 护身甲盾

      // 'ability_defection', //卧底
      // 小技能
      'ember_spirit_sleight_of_fist', // 无影拳
      'life_stealer_rage', // 狂暴
      'warlock_fatal_bonds', // 致命连接

      // 自定义技能
      'imba_chaos_knight_phantasm', // 混沌之军
      'bloodseeker_blood_mist2', // 血魔 血雾
      'ability_trigger_on_active', //紫蝴蝶
    ],
  },
  {
    level: 3,
    names: [
      // 主动技能
      // 大招
      'doom_bringer_doom', // 末日
      'shadow_shaman_mass_serpent_ward', // 群蛇守卫
      'necrolyte_reapers_scythe', // 死神镰刀
      'storm_spirit_ball_lightning', // 球状闪电
      'slark_shadow_dance', // 暗影之舞
      'brewmaster_primal_split_lua', // 元素分离 改
      'tidehunter_ravage', // 毁灭
      'dazzle_bad_juju', // 邪能
      'tinker_rearm_lua', // 再装填
      // 'dragon_knight_elder_dragon_form', //变龙 近战选择有问题
      'puck_dream_coil', // 梦境缠绕
      'elder_titan_earth_splitter', // 裂地沟壑

      // 小技能
      'dark_willow_shadow_realm', // 暗影之境
      'dark_seer_vacuum', // 真空
      'mars_bulwark', // 护身甲盾
      'magnataur_reverse_polarity', // 两级反转
      'antimage_counterspell', // 法术反制
      'dark_willow_bramble_maze', // 荆棘迷宫

      // 自定义技能
      'clinkz_burning_barrage2', // 炽烈火雨
      'ancient_apparition_freezing_aura', // 极寒光环
    ],
  },
  {
    level: 2,
    names: [
      // 主动技能
      // 大招
      'bounty_hunter_track', // 追踪术
      'lion_finger_of_death', // 死亡一指
      'medusa_stone_gaze', // 石化凝视
      'silencer_global_silence', // 全领域禁默
      'bloodseeker_rupture', // 割裂
      'centaur_stampede', // 奔袭冲撞
      'winter_wyvern_winters_curse', // 寒冬诅咒
      'kunkka_ghostship', // 幽灵船
      'pangolier_gyroshell', // 地雷滚滚
      'void_spirit_astral_step', // 太虚之径
      'treant_overgrowth', // 疯狂生长

      // 小技能
      'lion_impale', // 裂地尖刺
      'sven_storm_bolt', // 风暴之拳 斯温
      'lina_light_strike_array', // 光击阵
      'omniknight_repel', // 咸鱼恩赐
      'earthshaker_enchant_totem', // 强化图腾
      'templar_assassin_refraction', // 圣堂刺客 折光
      'centaur_double_edge', // 双刃剑
      'zuus_thundergods_wrath', // 雷神之怒
      'axe_berserkers_call', // 狂战士之吼
      'faceless_void_chronosphere', // 时间结界
      'marci_bodyguard', // 护卫术
      'shredder_whirling_death', // 死亡旋风
      'tidehunter_anchor_smash', // 锚击
      'primal_beast_trample', // 踏
      'mars_gods_rebuke', // 神之遣戒
      'tidehunter_kraken_shell', // 海妖外壳
      'antimage_blink', // 闪烁
      'ringmaster_tame_the_beasts', // 驯兽术
      'ringmaster_impalement', // 尖刀戏
      'slark_saltwater_shiv', // 海浪短刀
      'treant_natures_grasp', // 自然卷握

      // 自定义技能
      'lina_flame_cloak2', // 火女 腾焰斗篷
      'dazzle_rain_of_vermin', // 诅咒之雨
    ],
  },
  {
    level: 1,
    names: [
      // 主动技能
      // 大招
      'queenofpain_sonic_wave', // 超声冲击波
      'omniknight_guardian_angel', // 守护天使
      'earthshaker_echo_slam', // 回音击
      'witch_doctor_death_ward', // 死亡守卫
      'slardar_amplify_damage', // 侵蚀雾霭 点灯
      'ringmaster_wheel', // 奇观轮

      // 小技能
      'dazzle_shadow_wave', // 暗影波
      'skywrath_mage_arcane_bolt', // 天怒奥法鹰隼
      'kunkka_torrent', // 洪流
      'leshrac_split_earth', // 撕裂大地
      'witch_doctor_paralyzing_cask', // 麻痹药剂
      'templar_assassin_meld', // 圣堂刺客 隐匿
      'pudge_meat_hook', // 肉钩
      'bloodseeker_bloodrage', // 血怒
      'bounty_hunter_wind_walk', // 暗影步
      'earthshaker_fissure', // 沟壑
      'alchemist_acid_spray', // 酸雾
      'treant_living_armor', // 活体护甲
      'witch_doctor_maledict', // 诅咒
      'mirana_arrow', // 月神之箭
      'rattletrap_rocket_flare', // 照明火箭
      'tinker_heat_seeking_missile', // 热导飞弹
      'ancient_apparition_ice_vortex', // 冰霜漩涡
      'shadow_shaman_voodoo', // 妖术
      'lich_frost_armor', // 霜冻护甲

      // 自定义技能
      'arc_warden_scepter2', // 人工神符
    ],
  },
];

export const abilityTiersPassive: Tier[] = [
  {
    level: 5,
    names: [
      // 被动技能
      'muerta_gunslinger', // 神枪在手
      'slark_essence_shift2', // 能量转移
      'faceless_void_time_lock', // 时间锁定

      // 法球/开关技能
      'medusa_split_shot', // 分裂箭
      'winter_wyvern_arctic_burn', // 严寒灼烧

      // 自定义技能
      'batrider_smoldering_resin2', // 蝙蝠骑士 树脂
    ],
  },
  {
    level: 4,
    names: [
      // 被动技能
      'dazzle_good_juju', // 善咒
      'templar_assassin_psi_blades', // 灵能之刃
      'luna_moon_glaive', // 月刃
      'elder_titan_natural_order', // 自然秩序
      'phantom_assassin_coup_de_grace', // 恩赐解脱
      'sven_great_cleave', // 巨力挥舞
      'slardar_bash', // 深海重击
      'shredder_reactive_armor', // 活性活甲
      // 'spectre_dispersion', // 幽鬼 折射
      'spectre_dispersion2', // 幽鬼 折射改
      'clinkz_infernal_shred2', // 克林克兹先天 地狱之裂

      // 法球/开关技能
      'omniknight_hammer_of_purity', // 纯洁之锤

      // 自定义技能
      'dark_seer_normal_punch2', // 普通一拳
      'ogre_magi_multicast_lua', // 多重施法
      'dragon_knight_inherited_vigor2', // 龙骑 先天 龙血
      'jakiro_double_trouble2', // 双头龙 天生一对
      'leshrac_defilement2', // 大肆污染 拉席克
      'tinker_eureka2', // 修补匠 尤里卡！
      'rubick_might_and_magus2', // 拉比克 力量与魔法 魔剑
      'death_prophet_witchcraft2', // 死亡先知 巫术精研

      'ability_trigger_learned_skills', //蓝蝴蝶
      'ability_trigger_on_spell_reflect', //绿蝴蝶
      'ability_charge_damage', //青蝴蝶
      'ability_trigger_on_cast', //红蝴蝶
      'ability_trigger_on_attacked', //金蝴蝶
      'ability_trigger_on_move', //橙影蝴蝶
    ],
  },
  {
    level: 3,
    names: [
      // 被动技能
      'dawnbreaker_luminosity', // 熠熠生辉
      'axe_counter_helix', // 反击螺旋
      'earthshaker_aftershock', // 余震
      'chaos_knight_chaos_strike', // 混沌一击
      'centaur_return', // 人马 反伤
      'nevermore_dark_lord', // 魔王降临
      'kunkka_tidebringer', // 潮汐使者 水刀
      'riki_permanent_invisibility', // 永久隐身（旧版）
      'necrolyte_heartstopper_aura', // 竭心光环
      'weaver_geminate_attack', // 连击
      'spectre_desolate2', // 荒芜
      'brewmaster_fire_phase', // 永久相位
      'juggernaut_blade_dance', // 剑舞
      'tiny_grow', // 长大

      // 单位技能
      'frostbitten_golem_time_warp_aura', // 萨满 时间扭曲光环

      // 法球/开关技能
      'tusk_walrus_punch', //海象神拳

      // 自定义技能
      'drow_ranger_trueshot2', // 精准光环
      'sven_wrath_of_god2', // 斯文 神之愤怒
      'centaur_sturdy', // 人马 不屈
      'ancient_apparition_frost_orb', // 冰霜法球
      'medusa_mana_shield2', // 魔法盾
    ],
  },
  {
    level: 2,
    names: [
      // 被动技能
      'ursa_fury_swipes', // 怒意狂击
      'vengefulspirit_command_aura', // 复仇光环
      'bloodseeker_thirst', // 焦渴
      'rubick_arcane_supremacy', // 奥术至尊
      'monkey_king_jingu_mastery', // 如意棒法
      'skeleton_king_mortal_strike', // 本命一击
      'huskar_berserkers_blood', // 狂战士之血
      'legion_commander_moment_of_courage', // 勇气之霎
      'abyssal_underlord_atrophy_aura', // 衰退光环
      'obsidian_destroyer_equilibrium', // 精华变迁
      'abaddon_frostmourne', // 魔霭诅咒
      'lycan_feral_impulse', // 野性驱使

      // 法球/开关技能
      'doom_bringer_infernal_blade', // 阎刃
      'silencer_glaives_of_wisdom', // 智慧之刃
      'viper_poison_attack', // 毒性攻击

      // 单位技能
      'black_drake_magic_amplification_aura', // 黑蜉蝣 魔法增强光环

      // 自定义技能
      'crystal_maiden_ice_explosion', // 冰女 冰暴
      'abyssal_underlord_firestorm2', // 火雨降临
      'ursa_maul2', // 拍拍 天生技能 +攻击
      'abyssal_underlord_malice_aura', // 怨念光环
      'axe_one_man_army2', // 斧王 一人成军
      'faceless_void_backtrack2', // 虚空 回到过去
    ],
  },
  {
    level: 1,
    names: [
      // 被动技能
      'lina_fiery_soul', // 炽魂
      'drow_ranger_marksmanship', // 射手天赋
      'enchantress_untouchable', // 不可侵犯
      'alchemist_goblins_greed2', // 贪婪
      'spirit_breaker_greater_bash', // 巨力重击
      'antimage_mana_break', // 法力损毁
      'sniper_headshot', // 爆头
      'bounty_hunter_jinada', // 忍术
      'razor_storm_surge', // 风暴涌动
      'venomancer_poison_sting', // 剧毒术士 毒刺
      'night_stalker_hunter_in_the_night', // 暗夜猎影
      'troll_warlord_fervor', // 热血战魂
      'visage_gravekeepers_cloak', // 陵卫斗篷
      'life_stealer_ghoul_frenzy', // 尸鬼狂怒
      'viper_corrosive_skin', // 腐蚀皮肤
      'rubick_null_field', // 失效立场
      'pangolier_lucky_shot', // 幸运一击
      'crystal_maiden_brilliance_aura', // 奥术光环 冰女

      // 法球/开关技能
      'drow_ranger_frost_arrows', // 霜冻之箭
      'enchantress_impetus', // 推进
      'ancient_apparition_chilling_touch', // 极寒之触

      // 单位技能
      'kobold_tunneler_prospecting', // 狗头人 淘金光环
      'kobold_taskmaster_speed_aura', // 狗头人 速度光环

      // 自定义技能
      'bounty_hunter_cutpurse2', // 赏金 妙手空空 技能偷钱
      'dark_seer_quick_wit2', // 才思敏捷
    ],
  },
];
