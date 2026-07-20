/**
 * 出售物品配置
 * 管理AI英雄的出售物品列表
 */

/**
 * 特殊消耗物品列表 - 拥有这些物品时提高出售阈值
 * 这些物品比较重要，需要保留更多的物品栏空间
 */
export const SpecialConsumableItems: string[] = [
  'item_aegis', // 不朽之守护
  'item_tome_of_strength', // 力量书
  'item_tome_of_agility', // 敏捷书
  'item_tome_of_intelligence', // 智力书
  'item_tome_of_luoshu', // 洛书
  'item_wings_of_haste', // 急速之翼
  'item_ultimate_scepter_2', // 真·阿哈利姆神杖
  'item_moon_shard_datadriven', // 真·银月之晶
  'item_ward_observer', // 侦查守卫
  'item_ward_sentry', // 岗哨守卫
  'item_ward_dispenser', // 侦察·岗哨守卫
  'item_dust', // 显隐之尘
  'item_gem', // 真视宝石
  'item_smoke_of_deceit', // 诡计之雾
];

/**
 * 永不出售物品列表 - 即使数量重复也不会被当作多余物品出售
 */
export const NeverSellItems: string[] = [
  'item_ward_observer', // 侦查守卫
  'item_ward_sentry', // 岗哨守卫
  'item_ward_dispenser', // 侦察·岗哨守卫
];

/**
 * 通用出售垃圾物品列表 - 所有英雄都会出售的物品
 * 主要是基础配件和早期物品
 */
export const SellItemCommonJunkList: string[] = [
  // v社更新导致的异常出装
  'item_manta', // 幻影斧
  'item_sphere', // 林肯法球
  'item_dragon_lance', // 魔龙枪
  'item_diffusal_blade', // 净魂之刃
  'item_shadow_amulet', // 暗影护符

  // 配件
  'item_branches', // 铁树枝干
  'item_magic_stick', // 魔棒
  'item_magic_wand', // 魔杖
  'item_slippers', // 敏捷便靴
  'item_mantle', // 智力斗篷
  'item_gauntlets', // 力量手套
  'item_circlet', // 圆环
  'item_ring_of_protection', // 守护指环
  'item_sobi_mask', // 贤者面罩
  'item_wind_lace', // 风灵之纹
  'item_ring_of_basilius', // 王者之戒
  'item_quelling_blade', // 补刀斧
  'item_fluffy_hat', // 毛毛帽
  'item_orb_of_venom', // 淬毒之珠
  'item_orb_of_frost', // 冰霜之珠
  'item_crown', // 王冠
  'item_diadem', // 宝冕
  'item_belt_of_strength', // 力量腰带
  'item_boots_of_elves', // 精灵布带
  'item_robe', // 法师长袍
  'item_gloves', // 加速手套
  'item_blades_of_attack', // 攻击之爪
  'item_chainmail', // 锁子甲
  'item_helm_of_iron_will', // 铁意头盔
  'item_lifesteal', // 吸血面具
  'item_voodoo_mask', // 巫毒面具
  'item_ogre_axe', // 食人魔之斧
  'item_blade_of_alacrity', // 欢欣之刃
  'item_staff_of_wizardry', // 魔力法杖
  'item_wizard_hat', // 巫师帽
  'item_shawl', // 披巾
  'item_chasm_stone', // 裂隙之石
  'item_splintmail', // 片甲

  'item_meteor_hammer', // 陨星锤
  'item_kaya', // 慧光
  'item_sange', // 散华
  'item_yasha', // 夜叉
  'item_blitz_knuckles', // 闪电指套
  'item_javelin', // 标枪
  'item_claymore', // 大剑
  'item_mithril_hammer', // 秘银锤
  'item_void_stone', // 虚无宝石
  'item_ring_of_tarrasque', // 恐鳌之戒
  'item_headdress', // 恢复头巾
  'item_tiara_of_selemene', // 赛莉蒙妮之冠
  'item_vitality_booster', // 活力之球
  'item_energy_booster', // 能量之球
  'item_point_booster', // 精气之球
  'item_cornucopia', // 丰饶之环
  'item_talisman_of_evasion', // 闪避护符
  'item_broadsword', // 阔剑
  'item_platemail', // 板甲
  'item_hyperstone', // 振奋宝石
  'item_eagle', // 鹰歌弓
  'item_reaver', // 掠夺者之斧
  'item_mystic_staff', // 神秘法杖
  'item_demon_edge', // 恶魔刀锋
  'item_relic', // 圣者遗物
  'item_disperser', // 散魂剑
  'item_soul_booster', // 振魂石
  'item_pers', // 坚韧球
  'item_ultimate_orb', // 极限法球

  // 消耗品
  'item_tango_single',
  'item_tango',
  'item_blood_grenade', // 血腥榴弹
  'item_clarity',
  'item_faerie_fire',
  'item_enchanted_mango',
  'item_flask',
  'item_bottle',
  'item_foragers_stats', // 铁树坚果
  'item_foragers_mana', // 托莫干伞盖
  'item_foragers_health', // 活力伞菌
  // 疗伤莲花
  'item_famango',
  'item_great_famango',
  'item_greater_famango',
  'item_cheese', // 奶酪
  'item_roshans_banner', // 肉山的战旗
];

/**
 * 按价值排序的物品出售列表 - 当物品数量过多时按顺序出售
 * 从低价值到高价值排序：初级(<2k) -> 中级(2k~5k) -> 高级(5k~10k)
 */
export const ValueBasedSellItemsList: string[] = [
  // 初级道具 <2k
  'item_boots', // 草鞋
  'item_quelling_blade_2_datadriven', // 毒瘤之刃
  'item_bracer', // 护腕
  'item_null_talisman', // 挂件
  'item_wraith_band', // 系带
  'item_soul_ring', // 灵魂之戒
  'item_buckler', // 玄冥盾牌
  'item_orb_of_corrosion', // 腐蚀之球
  'item_pavise', // 长盾
  'item_phase_boots', // 相位
  'item_power_treads', // 动力鞋
  'item_arcane_boots', // 秘法
  'item_tranquil_boots', // 绿鞋
  'item_oblivion_staff', // 空明杖
  'item_falcon_blade', // 猎鹰战刃
  'item_cloak', // 抗魔斗篷
  'item_infused_raindrop', // 凝魂之露

  'item_ghost', // 幽魂权杖
  'item_mask_of_madness', // 疯狂面具
  'item_ancient_janggo', // 韧鼓
  'item_veil_of_discord', // 纷争

  // 中级道具 2k~5k
  'item_travel_boots', // 远行鞋
  'item_cyclone', // 吹风
  'item_mekansm', // 梅肯斯姆
  'item_echo_sabre', // 回音刃
  'item_force_staff', // 推推棒
  'item_glimmer_cape', // 微光
  'item_rod_of_atos', // 阿托斯之棍

  'item_kaya', // 慧光
  'item_sange', // 散华
  'item_yasha', // 夜叉
  'item_holy_locket', // 圣洁吊坠
  'item_blink', // 跳刀
  'item_solar_crest', // 炎阳纹章
  'item_blade_mail', // 刃甲
  'item_vanguard', // 先锋盾
  'item_basher', // 碎颅锤
  'item_armlet', // 臂章
  'item_hand_of_midas', // 点金手
  'item_aether_lens', // 以太透镜
  'item_aether_lens_2', // 以太透镜2

  // 高级道具 5k~10k
  'item_desolator', // 黯灭
  'item_black_king_bar', // BKB
  'item_pipe', // 笛子
  'item_heart', // 龙心
  'item_bfury', // 狂战斧
  'item_sheepstick', // 羊刀
  'item_greater_crit', // 大炮
  'item_sange_and_yasha', // 散夜对剑
  'item_heavens_halberd', // 天堂之戟
  'item_hurricane_pike', // 飓风长戟

  'item_echo_sabre_2', // 音速战刃
  'item_hand_of_group', // 团队之手

  'item_guardian_greaves', // 卫士胫甲
  'item_assault', // 强袭胸甲
  'item_shivas_guard', // 希瓦的守护
  'item_butterfly', // 蝴蝶
  'item_radiance', // 辉耀
  'item_satanic', // 撒旦
  'item_ethereal_blade', // 虚灵之刃
  'item_monkey_king_bar', // 金箍棒
  'item_mjollnir', // 雷神之锤
  'item_octarine_core', // 玲珑心
  'item_refresher', // 刷新球
  'item_silver_edge', // 白银之锋
  'item_phylactery', // 灵匣
  'item_abyssal_blade', // 深渊之刃
  'item_harpoon', // 鱼叉
  'item_rapier', // 圣剑
  'item_radiance_2', // 大辉耀 圣焰之光
  'item_dagon_5', // 达贡之神力（5级）

  // 终极道具 10k~ 不出售
];

/**
 * 英雄特定出售物品列表
 * 根据英雄名称配置特定的出售物品
 */
export const SellItemHeroList: Record<string, string[]> = {
  npc_dota_hero_abaddon: ['item_overwhelming_blink', 'item_echo_sabre_2'],
};
