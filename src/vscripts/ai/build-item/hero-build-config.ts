/**
 * 英雄出装配置
 * 基于 Tier 驱动的新系统
 */

import { HeroTemplate } from './hero-build-config-template';
import { ItemTier } from './item-tier-config';
import { CandidatePoolEntry } from './weighted-pool';

/**
 * 英雄出装配置接口（新版本 - 基于 Tier）
 */
export interface HeroBuildConfig {
  /** 使用的模板（必填，用于填充未配置的 tier） */
  template: HeroTemplate;

  /** 基于 Tier 的装备列表（可选） */
  targetItemsByTier?: {
    [tier: number]: CandidatePoolEntry[]; // 装备数组，不按槽位分类
  };
}

/**
 * 所有英雄的出装配置
 */
export const HeroBuilds: Record<string, HeroBuildConfig> = {
  // ===== 敏捷英雄 =====
  // 赏金猎人
  npc_dota_hero_bounty_hunter: {
    template: HeroTemplate.Agility,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_hand_of_midas', // 点金手
        'item_power_treads', // 动力鞋
        'item_vanguard', // 先锋盾
        'item_wraith_band', // 怨灵细带
        'item_orb_of_corrosion', // 腐蚀之珠
        'item_quelling_blade_2_datadriven', // 毒瘤之刃
        'item_falcon_blade', // 猎鹰战刃
      ],
      [ItemTier.T2]: [
        'item_sange_and_yasha', // 散夜对剑
        'item_monkey_king_bar', // 金箍棒
        'item_black_king_bar', // 黑皇杖
        'item_desolator', // 黯灭
        'item_bfury', // 狂战斧
        'item_manta', // 幻影斧
        'item_hand_of_group', // 团队之手
      ],
      [ItemTier.T3]: [
        'item_wasp_callous', // 大核荣耀冷酷
        'item_satanic', // 撒旦之邪力
        'item_butterfly', // 蝴蝶刀
        'item_dodo_desolator', // 黯灭头
        'item_angels_demise', // 天使陨落
        'item_sacred_trident', // 圣三叉戟
        'item_armlet_pro_max', // 臂章·终极
      ],
      [ItemTier.T4]: [
        'item_blue_fantasy', // 苍蓝幻想
        'item_sange_and_yasha_1', // 神器散夜
        'item_monkey_king_bar_2', // 定海神针
        'item_black_king_bar_2', // 真·BKB
        'item_infernal_desolator', // 绝对破防之刃
        'item_wasp_golden', // 黄金大核荣耀
        'item_excalibur', // EX咖喱棒
      ],
      [ItemTier.T5]: [
        'item_rapier_ultra_bot_1', // 圣剑终极版
        'item_magic_sword', // 魔渊剑
        'item_switchable_crit_blade', // 归海一刀
        'item_ten_thousand_swords', // 万剑
        'item_time_gem', // 时间宝石
        'item_beast_armor', // 兽化甲
        'item_withered_spring', // 生命之心
      ],
    },
  },
  // 血魔
  npc_dota_hero_bloodseeker: {
    template: HeroTemplate.Agility,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_hand_of_midas', // 点金手
        'item_phase_boots', // 相位鞋
        'item_wraith_band', // 怨灵细带
        'item_vanguard', // 先锋盾
        'item_orb_of_corrosion', // 腐蚀之珠
        'item_magic_wand', // 魔棒
        'item_falcon_blade', // 猎鹰战刃
      ],
      [ItemTier.T2]: [
        'item_basher', // 碎颅锤
        'item_echo_sabre_2', // 音速战刃
        'item_sange_and_yasha', // 散夜对剑
        'item_black_king_bar', // 黑皇杖
        'item_bfury', // 狂战斧
        'item_hand_of_group', // 团队之手
        'item_desolator', // 黯灭
      ],
      [ItemTier.T3]: [
        'item_mjollnir', // 雷神之锤
        'item_wasp_callous', // 大核荣耀冷酷
        'item_radiance_2', // 圣焰之光
        'item_satanic', // 撒旦之邪力
        'item_butterfly', // 蝴蝶刀
        'item_dodo_desolator', // 黯灭头
        'item_sacred_trident', // 三叉戟
      ],
      [ItemTier.T4]: [
        'item_blue_fantasy', // 苍蓝幻想
        'item_monkey_king_bar_2', // 定海神针
        'item_abyssal_blade_v2', // 一闪
        'item_infernal_desolator', // 绝对破防之刃
        'item_wasp_golden', // 黄金大核荣耀
        'item_black_king_bar_2', // 真·BKB
        'item_excalibur', // EX咖喱棒
      ],
      [ItemTier.T5]: [
        'item_rapier_ultra_bot_1', // 解放的诅咒圣剑
        'item_magic_sword', // 魔渊剑
        'item_ten_thousand_swords', // 万剑归宗
        'item_switchable_crit_blade', // 归海一刀
        'item_beast_armor', // 兽化甲
        'item_time_gem', // 时间宝石
        'item_magic_crit_blade', // 魔龙狂舞
      ],
    },
  },
  // 力丸
  npc_dota_hero_riki: {
    template: HeroTemplate.Agility,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_power_treads', // 动力鞋
        'item_wraith_band', // 怨灵细带
        'item_falcon_blade', // 猎鹰战刃
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 点金手
        'item_quelling_blade_2_datadriven', // 毒瘤之刃
        'item_vanguard', // 先锋盾
      ],
      [ItemTier.T2]: [
        'item_bfury', // 狂战斧
        'item_sange_and_yasha', // 散夜对剑
        'item_basher', // 碎颅锤
        'item_hand_of_group', // 团队之手
        'item_desolator', // 黯灭
        'item_octarine_core', // 玲珑心
        'item_aether_lens_2', // 以太透镜2
        'item_monkey_king_bar', // 金箍棒
      ],
      [ItemTier.T3]: [
        'item_greater_crit', // 代达罗斯之殇
        'item_dodo_desolator', // 黯灭头
        'item_butterfly', // 蝴蝶刀
        'item_wasp_despotic', // 大核荣耀暴虐
        'item_sacred_trident', // 三叉戟
        'item_radiance_2', // 圣焰之光
        'item_satanic', // 撒旦之邪力
      ],
      [ItemTier.T4]: [
        'item_monkey_king_bar_2', // 定海神针
        'item_infernal_desolator', // 绝对破防之刃
        'item_blue_fantasy', // 苍蓝幻想
        'item_sange_and_yasha_1', // 神器·散夜对剑
        'item_abyssal_blade_v2', // 一闪
        'item_satanic_2', // 真红·撒旦之邪力
        'item_excalibur', // EX咖喱棒
        'item_bfury_ultra', // 救世狂战
        'item_refresh_core', // 熔火核心
      ],
      [ItemTier.T5]: [
        'item_rapier_ultra_bot_1', // 解放的诅咒圣剑
        'item_magic_sword', // 魔渊剑
        'item_switchable_crit_blade', // 归海一刀
        'item_time_gem', // 时间宝石
        'item_ten_thousand_swords', // 万剑归宗
        'item_forbidden_staff', // 禁忌法杖
        'item_magic_crit_blade', // 魔龙狂舞
        'item_dracula_mask', // 生命之盔
        'item_swift_glove', // 无限手套
      ],
    },
  },

  npc_dota_hero_luna: {
    template: HeroTemplate.Agility,
    targetItemsByTier: {
      [ItemTier.T4]: [
        'item_monkey_king_bar_2', // 定海神针（tier 归属修正：真实价格属于 T4）
        'item_excalibur', // 圣剑
        'item_skadi_2', // 大冰眼
        'item_satanic_2', // 真·撒旦
        'item_black_king_bar_2', // 真·BKB
      ],
    },
  },

  npc_dota_hero_drow_ranger: {
    template: HeroTemplate.Agility,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_power_treads', // 动力鞋
        'item_wraith_band', // 怨灵细带
        'item_hand_of_midas', // 点金手
        'item_falcon_blade', // 猎鹰战刃
        'item_mask_of_madness', // 疯狂面具
        'item_magic_wand', // 魔杖
        'item_vanguard', // 先锋盾
      ],
      [ItemTier.T2]: [
        'item_hurricane_pike', // 飓风长戟
        'item_hand_of_group', // 团队之手
        'item_desolator', // 黯灭
        'item_force_staff', // 原力法杖
        'item_black_king_bar', // 黑皇杖
        'item_shotgun', // 双管霰弹枪
        'item_sange_and_yasha', // 散夜对剑
        'item_monkey_king_bar', // 金箍棒
        'item_aether_lens_2', // 以太透镜2
      ],
      [ItemTier.T3]: [
        'item_hurricane_pike_2', // 大推推
        'item_shotgun_v2', // 三管霰弹枪
        'item_butterfly', // 蝴蝶刀
        'item_hydras_breath', // 怪蛇之息
        'item_dodo_desolator', // 黯灭头
        'item_wasp_callous', // 大核荣耀冷酷
        'item_mjollnir', // 雷神之锤
        'item_sacred_trident', // 三叉戟
      ],
      [ItemTier.T4]: [
        'item_monkey_king_bar_2', // 定海神针（tier 归属修正：真实价格属于 T4）
        'item_excalibur', // 圣剑
        'item_satanic_2', // 真·撒旦
        'item_black_king_bar_2', // 真·BKB
        'item_infernal_desolator', // 绝对破防之刃
        'item_wasp_golden', // 黄金大核荣耀
        'item_sacred_six_vein', // 六脉神剑
        'item_hydras_breath_2', // 神器·千年毒蛟之息
        'item_sange_and_yasha_1', // 神器·散夜对剑
      ],
      [ItemTier.T5]: [
        'item_hawkeye_turret', // 鹰眼炮台
        'item_switchable_crit_blade', // 归海一刀
        'item_swift_glove', // 无限手套
        'item_ten_thousand_swords', // 万剑归宗
        'item_dracula_mask', // 生命之盔
        'item_beast_shield', // 兽化盾
        'item_time_gem', // 时间宝石
        'item_rapier_ultra_bot_1', // 解放的诅咒圣剑
        'item_magic_sword', // 魔渊剑
      ],
    },
  },

  npc_dota_hero_sniper: {
    template: HeroTemplate.Agility,
    targetItemsByTier: {
      [ItemTier.T3]: [
        'item_hurricane_pike_2', // 大推推
        'item_shotgun_v2', // 散弹枪（tier 归属修正：真实价格属于 T3）
      ],
      [ItemTier.T4]: [
        'item_monkey_king_bar_2', // 定海神针（tier 归属修正：真实价格属于 T4）
        'item_satanic_2', // 真·撒旦
        'item_black_king_bar_2', // 真·BKB
      ],
    },
  },

  // 冥界亚龙
  npc_dota_hero_viper: {
    template: HeroTemplate.Agility,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_power_treads', // 动力鞋
        'item_wraith_band', // 怨灵细带
        'item_vanguard', // 先锋盾
        'item_falcon_blade', // 猎鹰战刃
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 点金手
        'item_mask_of_madness', // 疯狂面具
      ],
      [ItemTier.T2]: [
        'item_sange_and_yasha', // 散夜对剑
        'item_travel_boots', // 远行鞋
        'item_hand_of_group', // 团队之手
        'item_hurricane_pike', // 飓风长戟
        'item_black_king_bar', // 黑皇杖
        'item_desolator', // 黯灭
        'item_shivas_guard', // 希瓦的守护
        'item_aether_lens_2', // 以太透镜2
      ],
      [ItemTier.T3]: [
        'item_hurricane_pike_2', // 黄金魔龙枪 Ultimate
        'item_wasp_callous', // 大核荣耀冷酷
        'item_shotgun_v2', // 三管霰弹枪
        'item_hydras_breath', // 怪蛇之息
        'item_dodo_desolator', // 黯灭头
        'item_sacred_trident', // 三叉戟
        'item_radiance_2', // 圣焰之光
        'item_mjollnir', // 雷神之锤
      ],
      [ItemTier.T4]: [
        'item_monkey_king_bar_2', // 定海神针
        'item_black_king_bar_2', // 天神杖
        'item_wasp_golden', // 黄金大核荣耀
        'item_refresh_core', // 熔火核心
        'item_skadi_2', // 粘妈之眼
        'item_excalibur', // EX咖喱棒
        'item_sacred_six_vein', // 六脉神剑
        'item_infernal_desolator', // 绝对破防之刃
        'item_hydras_breath_2', // 神器·千年毒蛟之息
      ],
      [ItemTier.T5]: [
        'item_rapier_ultra_bot_1', // 解放的诅咒圣剑
        'item_hawkeye_turret', // 鹰眼炮台
        'item_swift_glove', // 无限手套
        'item_time_gem', // 时间宝石
        'item_ten_thousand_swords', // 万剑归宗
        'item_switchable_crit_blade', // 归海一刀
        'item_magic_crit_blade', // 魔龙狂舞
        'item_beast_armor', // 兽化甲
        'item_magic_sword', // 魔渊剑
      ],
    },
  },

  // 复仇之魂
  npc_dota_hero_vengefulspirit: {
    template: HeroTemplate.Agility,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_power_treads', // 动力鞋
        'item_wraith_band', // 怨灵细带
        'item_falcon_blade', // 猎鹰战刃
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 点金手
        'item_mask_of_madness', // 疯狂面具
        'item_soul_ring', // 灵魂之戒
      ],
      [ItemTier.T2]: [
        'item_desolator', // 黯灭
        'item_sange_and_yasha', // 散夜对剑
        'item_hand_of_group', // 团队之手
        'item_hurricane_pike', // 飓风长戟
        'item_black_king_bar', // 黑皇杖
        'item_bfury', // 狂战斧
        'item_shotgun', // 双管霰弹枪
        'item_monkey_king_bar', // 金箍棒
      ],
      [ItemTier.T3]: [
        'item_hurricane_pike_2', // 大推推
        'item_wasp_callous', // 大核荣耀冷酷
        'item_dodo_desolator', // 黯灭头
        'item_shotgun_v2', // 三管霰弹枪
        'item_hydras_breath', // 怪蛇之息
        'item_mjollnir', // 雷神之锤
        'item_sacred_trident', // 三叉戟
      ],
      [ItemTier.T4]: [
        'item_monkey_king_bar_2', // 定海神针
        'item_infernal_desolator', // 绝对破防之刃
        'item_black_king_bar_2', // 天神杖
        'item_wasp_golden', // 黄金大核荣耀
        'item_skadi_2', // 粘妈之眼
        'item_excalibur', // EX咖喱棒
        'item_hydras_breath_2', // 神器·千年毒蛟之息
        'item_sacred_six_vein', // 六脉神剑
        'item_bfury_ultra', // 救世狂战
      ],
      [ItemTier.T5]: [
        'item_rapier_ultra_bot_1', // 解放的诅咒圣剑
        'item_hawkeye_turret', // 鹰眼炮台
        'item_swift_glove', // 无限手套
        'item_magic_sword', // 魔渊剑
        'item_switchable_crit_blade', // 归海一刀
        'item_ten_thousand_swords', // 万剑归宗
        'item_beast_shield', // 兽化盾
        'item_time_gem', // 时间宝石
        'item_dracula_mask', // 生命之盔
      ],
    },
  },

  npc_dota_hero_windrunner: {
    template: HeroTemplate.Agility,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_power_treads', // 动力鞋
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 点金手
        'item_mask_of_madness', // 疯狂面具
        'item_wraith_band', // 怨灵细带
        'item_vanguard', // 先锋盾
        'item_falcon_blade', // 猎鹰战刃
      ],
      [ItemTier.T2]: [
        'item_hand_of_group', // 团队之手
        'item_monkey_king_bar', // 金箍棒
        'item_desolator', // 黯灭
        'item_hurricane_pike', // 飓风长戟
        'item_black_king_bar', // 黑皇杖
        'item_shotgun', // 双管霰弹枪
        'item_octarine_core', // 玲珑心
        'item_aether_lens_2', // 以太透镜2
        'item_sange_and_yasha', // 散夜对剑
      ],
      [ItemTier.T3]: [
        'item_wasp_despotic', // 大核荣耀暴虐
        'item_hurricane_pike_2', // 黄金魔龙枪 Ultimate
        'item_greater_crit', // 代达罗斯之殇
        'item_mjollnir', // 雷神之锤
        'item_dodo_desolator', // 黯灭头
        'item_shotgun_v2', // 三管霰弹枪
        'item_sacred_trident', // 三叉戟
        'item_satanic', // 撒旦之邪力
      ],
      [ItemTier.T4]: [
        'item_infernal_desolator', // 绝对破防之刃
        'item_black_king_bar_2', // 天神杖
        'item_monkey_king_bar_2', // 定海神针
        'item_wasp_golden', // 黄金大核荣耀
        'item_skadi_2', // 粘妈之眼
        'item_excalibur', // EX咖喱棒
        'item_sacred_six_vein', // 六脉神剑
        'item_refresh_core', // 熔火核心
      ],
      [ItemTier.T5]: [
        'item_swift_glove', // 无限手套
        'item_rapier_ultra_bot_1', // 解放的诅咒圣剑
        'item_hawkeye_turret', // 鹰眼炮台
        'item_switchable_crit_blade', // 归海一刀
        'item_ten_thousand_swords', // 万剑归宗
        'item_magic_sword', // 魔渊剑
        'item_time_gem', // 时间宝石
        'item_dracula_mask', // 生命之盔
      ],
    },
  },

  // 幽鬼
  npc_dota_hero_spectre: {
    template: HeroTemplate.Agility,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_power_treads', // 动力鞋
        'item_wraith_band', // 怨灵细带
        'item_magic_wand', // 魔杖
        'item_vanguard', // 先锋盾
        'item_hand_of_midas', // 点金手
        'item_veil_of_discord', // 纷争面纱
        'item_orb_of_corrosion', // 腐蚀之珠
      ],
      [ItemTier.T2]: [
        'item_blade_mail', // 刃甲
        'item_hand_of_group', // 团队之手
        'item_lotus_orb', // 清莲宝珠
        'item_radiance', // 辉耀
        'item_sange_and_yasha', // 散夜对剑
        'item_black_king_bar', // 黑皇杖
        'item_armlet', // 莫尔迪基安的臂章
        'item_shivas_guard', // 希瓦的守护
      ],
      [ItemTier.T3]: [
        'item_blade_mail_2', // 刃甲2
        'item_radiance_2', // 圣焰之光
        'item_heart', // 恐鳌之心
        'item_eternal_shroud_ultra', // 法师泳衣
        'item_sacred_trident', // 三叉戟
        'item_aeon_pendant', // 咸鱼之王
        'item_armlet_pro_max', // 小鸡臂章Pro Max
        'item_vladmir_2', // 强袭祭品
        'item_dodo_desolator', // 黯灭头
      ],
      [ItemTier.T4]: [
        'item_undying_heart', // 不朽之心
        'item_blue_fantasy', // 苍蓝幻想
        'item_shivas_guard_2', // 雅典娜的守护
        'item_jump_jump_jump', // 跳！跳！跳！刀
        'item_satanic_2', // 真红·撒旦之邪力
        'item_saint_orb', // 圣女白莲
        'item_sacred_six_vein', // 六脉神剑
        'item_sange_and_yasha_1', // 神器·散夜对剑
        'item_force_field_ultra', // 神器·天地同寿甲
      ],
      [ItemTier.T5]: [
        'item_beast_armor', // 兽化甲
        'item_withered_spring', // 生命之心
        'item_ten_thousand_swords', // 万剑归宗
        'item_beast_shield', // 兽化盾
        'item_time_gem', // 时间宝石
        'item_magic_sword', // 魔渊剑
        'item_magic_crit_blade', // 魔龙狂舞
        'item_switchable_crit_blade', // 归海一刀
        'item_dracula_mask', // 生命之盔
      ],
    },
  },

  // ===== 智力英雄 =====

  npc_dota_hero_lion: {
    template: HeroTemplate.Intelligence,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_tranquil_boots', // 静谧之鞋
        'item_null_talisman', // 空灵挂件
        'item_hand_of_midas', // 点金手
        'item_magic_wand', // 魔杖
        'item_soul_ring', // 灵魂之戒
        'item_falcon_blade', // 猎鹰战刃
        'item_vanguard', // 先锋盾
      ],
      [ItemTier.T2]: [
        'item_aether_lens_2', // 以太透镜2
        'item_hand_of_group', // 团队之手
        'item_blink', // 闪烁匕首
        'item_glimmer_cape', // 微光披风
        'item_force_staff', // 原力法杖
        'item_octarine_core', // 玲珑心
        'item_refresher', // 刷新球
        'item_rod_of_atos', // 阿托斯之棍
      ],
      [ItemTier.T3]: [
        'item_aeon_pendant', // 永恒坠饰
        'item_phylactery', // 灵匣
        'item_angels_demise', // 绝刃
        'item_dagon_5', // 达贡之神力
        'item_magic_scepter', // 魔云法杖
        'item_arcane_blink_2', // 秘奥闪光
        'item_sheepstick', // 邪恶镰刀
      ],
      [ItemTier.T4]: [
        'item_hallowed_scepter', // 神圣魔法权杖
        'item_necronomicon_staff', // 死灵法师权杖
        'item_refresh_core', // 熔火核心
        'item_arcane_blink', // 大智力跳刀
        'item_gungir_2', // 风暴之锤
        'item_arcane_octarine_core', // 奥术之心
        'item_yasha_and_kaya_1', // 神器·慧夜对剑
        'item_sacred_six_vein', // 六脉神剑
      ],
      [ItemTier.T5]: [
        'item_time_gem', // 时间宝石
        'item_magic_crit_blade', // 魔龙狂舞
        'item_ten_thousand_swords', // 万剑
        'item_forbidden_staff', // 禁忌法杖
        'item_withered_spring', // 生命之心
        'item_dracula_mask', // 生命之盔
        'item_beast_armor', // 兽化甲
        'item_swift_glove', // 无限手套
      ],
    },
  },

  npc_dota_hero_lina: {
    template: HeroTemplate.Intelligence,
    targetItemsByTier: {
      [ItemTier.T4]: [
        'item_hallowed_scepter', // 神圣魔法权杖
        'item_necronomicon_staff', // 死灵法师权杖
        'item_refresh_core', // 熔火核心
        'item_arcane_blink', // 大智力跳刀
      ],
    },
  },

  npc_dota_hero_shadow_shaman: {
    template: HeroTemplate.Intelligence,
    targetItemsByTier: {
      [ItemTier.T3]: [
        'item_aeon_pendant', // 永恒坠饰
      ],
      [ItemTier.T4]: [
        'item_hallowed_scepter', // 神圣魔法权杖
        'item_necronomicon_staff', // 死灵法师权杖
        'item_refresh_core', // 熔火核心
        'item_arcane_blink', // 大智力跳刀
      ],
    },
  },

  // 天怒法师
  npc_dota_hero_skywrath_mage: {
    template: HeroTemplate.Intelligence,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_arcane_boots', // 奥术鞋
        'item_null_talisman', // 空灵挂件
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 点金手
        'item_soul_ring', // 灵魂之戒
        'item_falcon_blade', // 猎鹰战刃
        'item_vanguard', // 先锋盾
      ],
      [ItemTier.T2]: [
        'item_rod_of_atos', // 阿托斯之棍
        'item_force_staff', // 原力法杖
        'item_glimmer_cape', // 微光披风
        'item_refresher', // 刷新球
        'item_aether_lens_2', // 以太透镜2
        'item_hand_of_group', // 团队之手
        'item_octarine_core', // 玲珑心
        'item_kaya_and_sange', // 散慧对剑
        'item_yasha_and_kaya', // 慧夜对剑
      ],
      [ItemTier.T3]: [
        'item_angels_demise', // 绝刃
        'item_sacred_trident', // 三叉戟
        'item_bloodstone', // 血精神石
        'item_magic_scepter', // 魔云法杖
        'item_phylactery', // 灵匣
        'item_revenants_brooch_ultra', // 神器·魔武双修
        'item_dagon_5', // 达贡之神力
        'item_meteor_hammer_2', // 星落
      ],
      [ItemTier.T4]: [
        'item_sacred_six_vein', // 六脉神剑
        'item_hallowed_scepter', // 仙云法杖
        'item_refresh_core', // 熔火核心
        'item_necronomicon_staff', // 死灵法杖
        'item_arcane_octarine_core', // 奥术之心
        'item_kaya_and_sange_1', // 神器·散慧对剑
        'item_yasha_and_kaya_1', // 神器·慧夜对剑
        'item_gungir_2', // 风暴之锤
        'item_devastator_2', // 神圣斧
      ],
      [ItemTier.T5]: [
        'item_time_gem', // 时间宝石
        'item_magic_crit_blade', // 魔龙狂舞
        'item_forbidden_staff', // 禁忌法锤
        'item_ten_thousand_swords', // 万剑归宗
        'item_shadow_impact', // 暗影咒灭
        'item_beast_armor', // 兽化甲
        'item_beast_shield', // 兽化盾
        'item_withered_spring', // 生命之心
        'item_dracula_mask', // 生命之盔
      ],
    },
  },

  // ===== 力量英雄 =====

  npc_dota_hero_abaddon: {
    template: HeroTemplate.Strength,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_phase_boots', // 相位鞋
        'item_bracer', // 护腕
        'item_vanguard', // 先锋盾
        'item_soul_ring', // 灵魂之戒
        'item_orb_of_corrosion', // 腐蚀之珠
        'item_falcon_blade', // 猎鹰战刃
        'item_hand_of_midas', // 点金手
      ],
      [ItemTier.T2]: [
        'item_hand_of_group', // 团队之手
        'item_blink', // 闪烁匕首
        'item_blade_mail', // 刃甲
        'item_black_king_bar', // 黑皇杖
        'item_echo_sabre_2', // 回音战刃2
        'item_radiance', // 辉耀
        'item_shivas_guard', // 希瓦的守护
      ],
      [ItemTier.T3]: [
        'item_radiance_2', // 大辉耀 圣焰之光
        'item_orb_of_the_brine', // 苍洋魔珠
        'item_overwhelming_blink', // 力量跳刀
        'item_blade_mail_2', // 真·刃甲
        'item_heart', // 龙心
        'item_eternal_shroud_ultra', // 法师泳衣
        'item_aeon_pendant', // 永恒坠饰
      ],
      [ItemTier.T4]: [
        'item_shivas_guard_2', // 希瓦的守护2
        'item_saint_orb', // 圣女白莲
        'item_insight_armor', // 洞察护甲
        'item_black_king_bar_2', // 真·BKB
        'item_undying_heart', // 不朽之心
        'item_jump_jump_jump', // 跳跳跳刀
        'item_refresh_core', // 熔火核心
      ],
      [ItemTier.T5]: [
        'item_magic_sword', // 魔渊剑
        'item_time_gem', // 时间宝石
        'item_withered_spring', // 生命之心
        'item_beast_armor', // 兽化甲
        'item_beast_shield', // 兽化盾
        'item_ten_thousand_swords', // 万剑
        'item_switchable_crit_blade', // 归海一刀
      ],
    },
  },

  npc_dota_hero_axe: {
    template: HeroTemplate.Strength,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_hand_of_midas', // 点金手
        'item_phase_boots', // 相位鞋
        'item_bracer', // 护腕
        'item_vanguard', // 先锋盾
        'item_soul_ring', // 灵魂之戒
        'item_falcon_blade', // 猎鹰战刃
        'item_orb_of_corrosion', // 腐蚀之珠
      ],
      [ItemTier.T2]: [
        'item_blink', // 闪烁匕首
        'item_blade_mail', // 刃甲
        'item_echo_sabre_2', // 回音战刃2
        'item_radiance', // 辉耀
        'item_black_king_bar', // 黑皇杖
        'item_basher', // 昆卡玛拉
        'item_shivas_guard', // 希瓦的守护
      ],
      [ItemTier.T3]: [
        'item_blade_mail_2', // 真·刃甲
        'item_radiance_2', // 大辉耀
        'item_overwhelming_blink', // 力量跳刀
        'item_abyssal_blade', // 深渊之刃
        'item_heart', // 龙心
        'item_eternal_shroud_ultra', // 法师泳衣
        'item_armlet_pro_max', // 臂章·终极
      ],
      [ItemTier.T4]: [
        'item_jump_jump_jump', // 跳跳跳刀（tier 归属修正：从 T5 移入，真实价格属于 T4）
        'item_insight_armor', // 洞察护甲
        'item_black_king_bar_2', // 真·BKB
        'item_abyssal_blade_v2', // 一闪
        'item_shivas_guard_2', // 希瓦的守护2
        'item_undying_heart', // 不朽之心
        'item_saint_orb', // 圣女白莲
        'item_refresh_core', // 熔火核心
      ],
      [ItemTier.T5]: [
        'item_withered_spring', // 生命之心
        'item_beast_shield', // 兽化盾
        'item_beast_armor', // 兽化甲
        'item_ten_thousand_swords', // 万剑
        'item_time_gem', // 时间宝石
        'item_magic_crit_blade', // 魔龙狂舞
        'item_forbidden_staff', // 禁忌法杖
      ],
    },
  },

  npc_dota_hero_pudge: {
    template: HeroTemplate.Strength,
    targetItemsByTier: {
      [ItemTier.T3]: [
        'item_blade_mail_2', // 真·刃甲
        'item_radiance_2', // 大辉耀
        'item_eternal_shroud_ultra', // 法师泳衣
      ],
      [ItemTier.T4]: [
        'item_undying_heart', // 不朽之心
        'item_black_king_bar_2', // 真·BKB
        'item_overwhelming_blink_2', // 大力量跳刀
      ],
    },
  },

  // 斯温
  npc_dota_hero_sven: {
    template: HeroTemplate.Strength,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_power_treads', // 动力鞋
        'item_bracer', // 护腕
        'item_quelling_blade_2_datadriven', // 毒瘤之刃
        'item_mask_of_madness', // 疯狂面具
        'item_vanguard', // 先锋盾
        'item_falcon_blade', // 猎鹰战刃
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 点金手
      ],
      [ItemTier.T2]: [
        'item_sange_and_yasha', // 散夜对剑
        'item_blink', // 闪烁匕首
        'item_echo_sabre_2', // 音速战刃
        'item_black_king_bar', // 黑皇杖
        'item_hand_of_group', // 团队之手
        'item_desolator', // 黯灭
        'item_monkey_king_bar', // 金箍棒
        'item_armlet', // 莫尔迪基安的臂章
      ],
      [ItemTier.T3]: [
        'item_vladmir_2', // 强袭祭品
        'item_wasp_despotic', // 大核荣耀暴虐
        'item_armlet_pro_max', // 小鸡臂章Pro Max
        'item_dodo_desolator', // 黯灭头
        'item_greater_crit', // 代达罗斯之殇
        'item_sacred_trident', // 三叉戟
        'item_heart', // 恐鳌之心
        'item_satanic', // 撒旦之邪力
      ],
      [ItemTier.T4]: [
        'item_black_king_bar_2', // 天神杖
        'item_monkey_king_bar_2', // 定海神针
        'item_infernal_desolator', // 绝对破防之刃
        'item_wasp_golden', // 黄金大核荣耀
        'item_undying_heart', // 不朽之心
        'item_sacred_six_vein', // 六脉神剑
        'item_excalibur', // EX咖喱棒
        'item_refresh_core', // 熔火核心
        'item_sange_and_yasha_1', // 神器·散夜对剑
      ],
      [ItemTier.T5]: [
        'item_rapier_ultra_bot_1', // 解放的诅咒圣剑
        'item_switchable_crit_blade', // 归海一刀
        'item_ten_thousand_swords', // 万剑归宗
        'item_magic_sword', // 魔渊剑
        'item_withered_spring', // 生命之心
        'item_beast_shield', // 兽化盾
        'item_dracula_mask', // 生命之盔
        'item_swift_glove', // 无限手套
        'item_time_gem', // 时间宝石
      ],
    },
  },

  // 昆卡
  npc_dota_hero_kunkka: {
    template: HeroTemplate.Strength,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_power_treads', // 动力鞋
        'item_bracer', // 护腕
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 点金手
        'item_lesser_crit', // 水晶剑
        'item_quelling_blade_2_datadriven', // 毒瘤之刃
        'item_vanguard', // 先锋盾
      ],
      [ItemTier.T2]: [
        'item_bfury', // 狂战斧
        'item_armlet', // 莫尔迪基安的臂章
        'item_blade_mail', // 刃甲
        'item_hand_of_group', // 团队之手
        'item_black_king_bar', // 黑皇杖
        'item_desolator', // 黯灭
        'item_octarine_core', // 玲珑心
        'item_sange_and_yasha', // 散夜对剑
      ],
      [ItemTier.T3]: [
        'item_greater_crit', // 代达罗斯之殇
        'item_vladmir_2', // 强袭祭品
        'item_silver_edge_2', // 无敌之刃
        'item_wasp_despotic', // 大核荣耀暴虐
        'item_bloodstone', // 血精神石
        'item_dodo_desolator', // 黯灭头
        'item_armlet_pro_max', // 小鸡臂章Pro Max
        'item_sacred_trident', // 三叉戟
        'item_radiance_2', // 圣焰之光
      ],
      [ItemTier.T4]: [
        'item_black_king_bar_2', // 天神杖
        'item_infernal_desolator', // 绝对破防之刃
        'item_wasp_golden', // 黄金大核荣耀
        'item_refresh_core', // 熔火核心
        'item_abyssal_blade_v2', // 一闪
        'item_excalibur', // EX咖喱棒
        'item_sacred_six_vein', // 六脉神剑
        'item_bfury_ultra', // 救世狂战
        'item_sange_and_yasha_1', // 神器·散夜对剑
      ],
      [ItemTier.T5]: [
        'item_switchable_crit_blade', // 归海一刀
        'item_magic_sword', // 魔渊剑
        'item_ten_thousand_swords', // 万剑归宗
        'item_time_gem', // 时间宝石
        'item_rapier_ultra_bot_1', // 解放的诅咒圣剑
        'item_withered_spring', // 生命之心
        'item_beast_armor', // 兽化甲
        'item_beast_shield', // 兽化盾
        'item_swift_glove', // 无限手套
      ],
    },
  },

  // 混沌骑士
  npc_dota_hero_chaos_knight: {
    template: HeroTemplate.Strength,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_power_treads', // 动力鞋
        'item_bracer', // 护腕
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 点金手
        'item_vanguard', // 先锋盾
        'item_soul_ring', // 灵魂之戒
        'item_falcon_blade', // 猎鹰战刃
      ],
      [ItemTier.T2]: [
        'item_armlet', // 莫尔迪基安的臂章
        'item_sange_and_yasha', // 散夜对剑
        'item_echo_sabre_2', // 音速战刃
        'item_basher', // 碎颅锤
        'item_echo_sabre', // 回音战刃
        'item_hand_of_group', // 团队之手
        'item_black_king_bar', // 黑皇杖
        'item_bfury', // 狂战斧
        'item_desolator', // 黯灭
      ],
      [ItemTier.T3]: [
        'item_vladmir_2', // 强袭祭品
        'item_dodo_desolator', // 黯灭头
        'item_armlet_pro_max', // 小鸡臂章Pro Max
        'item_sacred_trident', // 三叉戟
        'item_heart', // 恐鳌之心
        'item_overwhelming_blink', // 力量跳刀
        'item_blade_mail_2', // 刃甲2
      ],
      [ItemTier.T4]: [
        'item_infernal_desolator', // 绝对破防之刃
        'item_insight_armor', // 洞察盔甲
        'item_undying_heart', // 不朽之心
        'item_abyssal_blade_v2', // 一闪
        'item_excalibur', // EX咖喱棒
        'item_black_king_bar_2', // 天神杖
        'item_bfury_ultra', // 救世狂战
        'item_sacred_six_vein', // 六脉神剑
        'item_sange_and_yasha_1', // 神器·散夜对剑
      ],
      [ItemTier.T5]: [
        'item_rapier_ultra_bot_1', // 解放的诅咒圣剑
        'item_beast_shield', // 兽化盾
        'item_withered_spring', // 生命之心
        'item_magic_sword', // 魔渊剑
        'item_ten_thousand_swords', // 万剑归宗
        'item_switchable_crit_blade', // 归海一刀
        'item_beast_armor', // 兽化甲
        'item_swift_glove', // 无限手套
        'item_time_gem', // 时间宝石
      ],
    },
  },

  // ===== 智力英雄（辅助向）=====

  // 霍乱之源
  npc_dota_hero_bane: {
    template: HeroTemplate.Intelligence,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_hand_of_midas', // 点金手
        'item_arcane_boots', // 奥术鞋
        'item_null_talisman', // 空灵挂件
        'item_magic_wand', // 魔棒
        'item_soul_ring', // 灵魂之戒
        'item_falcon_blade', // 猎鹰战刃
        'item_vanguard', // 先锋盾
      ],
      [ItemTier.T2]: [
        'item_rod_of_atos', // 阿托斯之棍
        'item_glimmer_cape', // 微光披风
        'item_force_staff', // 原力法杖
        'item_holy_locket', // 圣洁吊坠
        'item_aeon_disk', // 永恒之盘
        'item_hand_of_group', // 团队之手
        'item_guardian_greaves', // 卫士胫甲
        'item_shivas_guard', // 希瓦的守护
        'item_blink', // 闪烁匕首
        'item_aether_lens', // 以太透镜
      ],
      [ItemTier.T3]: [
        'item_sheepstick', // 邪恶镰刀
        'item_aeon_pendant', // 永恒吊坠
        'item_orb_of_the_brine', // 苍洋魔珠
        'item_magic_scepter', // 魔法权杖
        'item_angels_demise', // 天使陨落
        'item_arcane_blink_2', // 奥术闪烁2
        'item_ethereal_blade', // 虚灵之刃
      ],
      [ItemTier.T4]: [
        'item_gungir_2', // 风暴之锤
        'item_guardian_greaves_artifact', // 神器 卫士胫甲
        'item_necronomicon_staff', // 死灵法杖
        'item_refresh_core', // 熔火核心
        'item_shivas_guard_2', // 希瓦的守护2
        'item_hallowed_scepter', // 仙云法杖
        'item_arcane_octarine_core', // 奥术之心
      ],
      [ItemTier.T5]: [
        'item_time_gem', // 时间宝石
        'item_magic_crit_blade', // 魔龙狂舞
        'item_ten_thousand_swords', // 万剑
        'item_forbidden_staff', // 禁忌法杖
        'item_withered_spring', // 生命之心
        'item_beast_armor', // 兽化甲
        'item_beast_shield', // 兽化盾
      ],
    },
  },

  npc_dota_hero_crystal_maiden: {
    template: HeroTemplate.Intelligence,
    targetItemsByTier: {
      [ItemTier.T2]: [
        'item_aether_lens_2', // 大以太
      ],
      [ItemTier.T3]: [
        'item_aeon_pendant', // 永恒坠饰
      ],
      [ItemTier.T4]: [
        'item_hallowed_scepter', // 神圣魔法权杖
        'item_necronomicon_staff', // 死灵法师权杖
        'item_refresh_core', // 熔火核心
      ],
    },
  },

  // 巫妖
  npc_dota_hero_lich: {
    template: HeroTemplate.Intelligence,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_tranquil_boots', // 静谧之鞋
        'item_null_talisman', // 空灵挂件
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 点金手
        'item_soul_ring', // 灵魂之戒
        'item_falcon_blade', // 猎鹰战刃
        'item_vanguard', // 先锋盾
      ],
      [ItemTier.T2]: [
        'item_aether_lens_2', // 以太透镜2
        'item_blink', // 闪烁匕首
        'item_rod_of_atos', // 阿托斯之棍
        'item_glimmer_cape', // 微光披风
        'item_force_staff', // 原力法杖
        'item_octarine_core', // 玲珑心
        'item_hand_of_group', // 团队之手
        'item_refresher', // 刷新球
      ],
      [ItemTier.T3]: [
        'item_aeon_pendant', // 永恒坠饰
        'item_sheepstick', // 邪恶镰刀
        'item_magic_scepter', // 魔云法杖
        'item_angels_demise', // 绝刃
        'item_sacred_trident', // 三叉戟
        'item_dagon_5', // 达贡之神力
        'item_orb_of_the_brine', // 苍洋魔珠
      ],
      [ItemTier.T4]: [
        'item_refresh_core', // 熔火核心
        'item_gungir_2', // 风暴之锤
        'item_hallowed_scepter', // 神圣魔法权杖
        'item_necronomicon_staff', // 死灵法师权杖
        'item_shivas_guard_2', // 希瓦的守护2
        'item_arcane_octarine_core', // 奥术之心
        'item_yasha_and_kaya_1', // 神器·慧夜对剑
        'item_kaya_and_sange_1', // 神器·散慧对剑
        'item_sacred_six_vein', // 六脉神剑
      ],
      [ItemTier.T5]: [
        'item_time_gem', // 时间宝石
        'item_magic_crit_blade', // 魔龙狂舞
        'item_withered_spring', // 生命之心
        'item_ten_thousand_swords', // 万剑
        'item_forbidden_staff', // 禁忌法杖
        'item_shadow_impact', // 暗影咒灭
        'item_beast_armor', // 兽化甲
        'item_beast_shield', // 兽化盾
      ],
    },
  },

  // ===== 全才英雄 =====

  // 死亡先知
  npc_dota_hero_death_prophet: {
    template: HeroTemplate.Universal,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_arcane_boots', // 奥术鞋
        'item_null_talisman', // 空灵挂件
        'item_magic_wand', // 魔杖
        'item_vanguard', // 先锋盾
        'item_hand_of_midas', // 点金手
        'item_soul_ring', // 灵魂之戒
        'item_falcon_blade', // 猎鹰战刃
      ],
      [ItemTier.T2]: [
        'item_aether_lens_2', // 以太透镜2
        'item_force_staff', // 原力法杖
        'item_glimmer_cape', // 微光披风
        'item_cyclone', // Eul的神圣法杖
        'item_hand_of_group', // 团队之手
        'item_hurricane_pike', // 飓风长戟
        'item_octarine_core', // 玲珑心
        'item_black_king_bar', // 黑皇杖
        'item_sange_and_yasha', // 散夜对剑
      ],
      [ItemTier.T3]: [
        'item_aeon_pendant', // 咸鱼之王
        'item_sheepstick', // 邪恶镰刀
        'item_hurricane_pike_2', // 黄金魔龙枪 Ultimate
        'item_hydras_breath', // 怪蛇之息
        'item_shotgun_v2', // 三管霰弹枪
        'item_sacred_trident', // 三叉戟
        'item_magic_scepter', // 魔云法杖
        'item_revenants_brooch_ultra', // 神器·魔武双修
        'item_dodo_desolator', // 黯灭头
      ],
      [ItemTier.T4]: [
        'item_shivas_guard_2', // 雅典娜的守护
        'item_refresh_core', // 熔火核心
        'item_hallowed_scepter', // 仙云法杖
        'item_sacred_six_vein', // 六脉神剑
        'item_necronomicon_staff', // 死灵法杖
        'item_black_king_bar_2', // 天神杖
        'item_hydras_breath_2', // 神器·千年毒蛟之息
        'item_arcane_octarine_core', // 奥术之心
        'item_infernal_desolator', // 绝对破防之刃
      ],
      [ItemTier.T5]: [
        'item_magic_crit_blade', // 魔龙狂舞
        'item_ten_thousand_swords', // 万剑归宗
        'item_time_gem', // 时间宝石
        'item_swift_glove', // 无限手套
        'item_hawkeye_turret', // 鹰眼炮台
        'item_withered_spring', // 生命之心
        'item_beast_shield', // 兽化盾
        'item_beast_armor', // 兽化甲
        'item_switchable_crit_blade', // 归海一刀
      ],
    },
  },
};

/**
 * 获取英雄的出装配置
 * 如果英雄没有配置，返回 undefined
 */
export function getHeroBuildConfig(heroName: string): HeroBuildConfig | undefined {
  return HeroBuilds[heroName];
}
