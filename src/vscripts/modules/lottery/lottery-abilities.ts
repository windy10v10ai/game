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
    ],
  },
  {
    level: 4,
    names: [
      // 主动技能
      // 大招
      'bounty_hunter_track', // 追踪术
      'juggernaut_omni_slash', // 无敌斩
      'sven_gods_strength', // 神之力量
      'legion_commander_duel', // 决斗

      // 小技能
      'ember_spirit_sleight_of_fist', // 无影拳

      // 自定义技能
      'imba_chaos_knight_phantasm', // 混沌之军
    ],
  },
  {
    level: 3,
    names: [
      // 主动技能
      // 大招
      'doom_bringer_doom', // 末日
      'lion_finger_of_death', // 死亡一指
      'shadow_shaman_mass_serpent_ward', // 群蛇守卫
      'necrolyte_reapers_scythe', // 死神镰刀
      'storm_spirit_ball_lightning', // 球状闪电
      'slark_shadow_dance', // 暗影之舞
      'brewmaster_primal_split_lua', // 元素分离 改
      'medusa_stone_gaze', // 石化凝视
      'tidehunter_ravage', // 毁灭
      'dazzle_bad_juju', // 邪能
      'tinker_rearm_lua', // 再装填
      'marci_unleash', // 怒拳破

      // 小技能
      'dark_willow_shadow_realm', // 暗影之境
      'dark_seer_vacuum', // 真空
      'mars_bulwark', // 护身甲盾
      'sandking_burrowstrike', // 穿刺 沙王
      'antimage_counterspell', // 法术反制

      // 自定义技能
      'clinkz_burning_barrage2', // 炽烈火雨
      'ancient_apparition_freezing_aura', // 极寒光环
      'sniper_assassinate_upgrade', // 暗杀（群体）
    ],
  },
  {
    level: 2,
    names: [
      // 主动技能
      // 大招
      'silencer_global_silence', // 全领域禁默
      'bloodseeker_rupture', // 割裂
      'centaur_stampede', // 奔袭冲撞
      'winter_wyvern_winters_curse', // 寒冬诅咒
      'weaver_time_lapse', // 时光倒流
      'witch_doctor_death_ward', // 死亡守卫
      'kunkka_ghostship', // 幽灵船
      'slardar_amplify_damage', // 侵蚀雾霭 点灯
      'pangolier_gyroshell', // 地雷滚滚

      // 小技能
      'lion_impale', // 裂地尖刺
      'sven_storm_bolt', // 风暴之拳 斯温
      'kunkka_torrent', // 洪流
      'lina_light_strike_array', // 光击阵
      'slardar_slithereen_crush', // 鱼人碎击
      'omniknight_repel', // 咸鱼恩赐
      'earthshaker_enchant_totem', // 强化图腾
      'templar_assassin_refraction', // 圣堂刺客 折光
      'phantom_assassin_phantom_strike', // 幻影突袭
      'spirit_breaker_charge_of_darkness', // 暗影冲刺
      'weaver_shukuchi', // 缩地
      'centaur_double_edge', // 双刃剑
      'centaur_hoof_stomp', // 战争践踏
      'axe_berserkers_call', // 狂战士之吼
      'tinker_laser', // 激光
      'tinker_defense_matrix', // 防御矩阵
      'marci_bodyguard', // 护卫术

      // 自定义技能
      'lina_flame_cloak2', // 火女 腾焰斗篷
      'dazzle_rain_of_vermin', // 诅咒之雨
      'bloodseeker_blood_mist2', // 血魔 血雾
      'alchemist_berserk_potion2', // 狂暴药剂 new
    ],
  },
  {
    level: 1,
    names: [
      // 主动技能
      // 大招
      'axe_culling_blade', // 淘汰之刃
      'sniper_assassinate', // 暗杀
      'queenofpain_sonic_wave', // 超声冲击波
      'skywrath_mage_mystic_flare', // 神秘之耀
      'omniknight_guardian_angel', // 守护天使
      'earthshaker_echo_slam', // 回音击

      // 小技能
      'witch_doctor_paralyzing_cask', // 麻痹药剂
      'templar_assassin_meld', // 圣堂刺客 隐匿
      'sniper_shrapnel', // 霰弹雨
      'pudge_meat_hook', // 肉钩
      'pudge_flesh_heap', // 屠夫 肉盾
      'bloodseeker_bloodrage', // 血怒
      'bounty_hunter_wind_walk', // 暗影步
      'tidehunter_kraken_shell', // 海妖外壳
      'antimage_blink', // 闪烁
      'earthshaker_fissure', // 沟壑
      'alchemist_acid_spray', // 酸雾
      'treant_living_armor', // 活体护甲
      'witch_doctor_maledict', // 诅咒
      'phantom_assassin_stifling_dagger', // 窒碍短匕
      'dark_seer_ion_shell', // 离子外壳
      'mirana_arrow', // 月神之箭
      'rattletrap_rocket_flare', // 照明火箭
      'tinker_heat_seeking_missile', // 热导飞弹
      'medusa_mystic_snake', // 秘术异蛇
      'ancient_apparition_ice_vortex', // 冰霜漩涡
      'bloodseeker_blood_bath', // 血祭
      'dark_willow_bramble_maze', // 荆棘迷宫
      'lich_frost_armor', // 霜冻护甲
      'abaddon_aphotic_shield', // 无光之盾
      'shadow_shaman_ether_shock', // 苍穹震击
      'tiny_avalanche', // 山崩

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
      'slark_essence_shift', // 能量转移
      'templar_assassin_psi_blades', // 灵能之刃
      'dazzle_good_juju', // 善咒
      'luna_moon_glaive', // 月刃

      // 法球/开关技能
      'medusa_split_shot', // 分裂箭
      'winter_wyvern_arctic_burn', // 严寒灼烧
    ],
  },
  {
    level: 4,
    names: [
      // 被动技能
      'elder_titan_natural_order', // 自然秩序
      'phantom_assassin_coup_de_grace', // 恩赐解脱
      'earthshaker_aftershock', // 余震
      'sven_great_cleave', // 巨力挥舞
      'faceless_void_time_lock', // 时间锁定
      'slardar_bash', // 深海重击
      'shredder_reactive_armor', // 活性活甲
      'dawnbreaker_luminosity', // 熠熠生辉
      'axe_counter_helix', // 反击螺旋

      // 法球/开关技能
      'omniknight_hammer_of_purity', // 纯洁之锤

      // 自定义技能
      'dark_seer_normal_punch2', // 普通一拳
      'ogre_magi_multicast_lua', // 多重施法
      'dragon_knight_inherited_vigor2', // 龙骑 先天 龙血
      'jakiro_double_trouble2', // 双头龙 天生一对
      'leshrac_defilement2', // 大肆污染 拉席克
    ],
  },
  {
    level: 3,
    names: [
      // 被动技能
      'chaos_knight_chaos_strike', // 混沌一击
      'centaur_return', // 人马 反伤
      'ursa_fury_swipes', // 怒意狂击
      'vengefulspirit_command_aura', // 复仇光环
      'nevermore_dark_lord', // 魔王降临
      'kunkka_tidebringer', // 潮汐使者 水刀
      'riki_permanent_invisibility', // 永久隐身（旧版）
      'necrolyte_heartstopper_aura', // 竭心光环
      'weaver_geminate_attack', // 连击
      'spectre_desolate', // 荒芜
      'brewmaster_fire_phase', // 永久相位
      'juggernaut_blade_dance', // 剑舞
      'spectre_dispersion', // 幽鬼 折射

      // 单位技能
      'frostbitten_golem_time_warp_aura', // 萨满 时间扭曲光环

      // 法球/开关技能
      'doom_bringer_infernal_blade', // 阎刃
      'viper_poison_attack', // 毒性攻击
      'silencer_glaives_of_wisdom', // 智慧之刃

      // 自定义技能
      'batrider_smoldering_resin2', // 蝙蝠骑士 树脂
      'drow_ranger_trueshot2', // 精准光环
      'abyssal_underlord_firestorm2', // 火雨降临
      'crystal_maiden_ice_explosion', // 冰女 冰暴
      'sven_wrath_of_god2', // 斯文 神之愤怒
      'centaur_sturdy', // 人马 不屈
      'ancient_apparition_frost_orb', // 冰霜法球
      'tinker_eureka2', // 修补匠 尤里卡！
      'death_prophet_witchcraft2', // 死亡先知 巫术精研
    ],
  },
  {
    level: 2,
    names: [
      // 被动技能
      'drow_ranger_marksmanship', // 射手天赋
      'bloodseeker_thirst', // 焦渴
      'rubick_arcane_supremacy', // 奥术至尊
      'lina_fiery_soul', // 炽魂
      'monkey_king_jingu_mastery', // 如意棒法
      'skeleton_king_mortal_strike', // 本命一击
      'huskar_berserkers_blood', // 狂战士之血
      'legion_commander_moment_of_courage', // 勇气之霎
      'abyssal_underlord_atrophy_aura', // 衰退光环
      'obsidian_destroyer_equilibrium', // 精华变迁
      'abaddon_frostmourne', // 魔霭诅咒
      'tiny_grow', // 长大

      // 法球/开关技能
      'drow_ranger_frost_arrows', // 霜冻之箭
      'ancient_apparition_chilling_touch', // 极寒之触

      // 单位技能
      'black_drake_magic_amplification_aura', // 黑蜉蝣 魔法增强光环

      // 自定义技能
      'ursa_maul2', // 拍拍 天生技能 +攻击
      'abyssal_underlord_malice_aura', // 怨念光环
      'axe_one_man_army2', // 斧王 一人成军
      'medusa_mana_shield2', // 魔法盾
    ],
  },
  {
    level: 1,
    names: [
      // 被动技能
      'enchantress_untouchable', // 不可侵犯
      'alchemist_goblins_greed2', // 贪婪
      'spirit_breaker_greater_bash', // 巨力重击
      'lycan_feral_impulse', // 野性驱使
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
      'enchantress_impetus', // 推进

      // 单位技能
      'kobold_tunneler_prospecting', // 狗头人 淘金光环
      'kobold_taskmaster_speed_aura', // 狗头人 速度光环

      // 自定义技能
      'bounty_hunter_cutpurse2', // 赏金 妙手空空 技能偷钱
      'dark_seer_quick_wit2', // 才思敏捷
      'faceless_void_backtrack2', // 虚空 回到过去
    ],
  },
];
