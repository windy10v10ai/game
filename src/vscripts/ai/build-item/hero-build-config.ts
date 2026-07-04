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
 * 未配置的英雄将根据攻击类型自动使用 AgilityCarryMelee 或 AgilityCarryRanged 模板
 */
export const HeroBuilds: Record<string, HeroBuildConfig> = {
  // ===== 敏捷核心英雄(近战) =====
  // 赏金猎人
  npc_dota_hero_bounty_hunter: {
    template: HeroTemplate.AgilityCarryMelee,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_hand_of_midas', // 金手指
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
        'item_desolator', // 破晓
        'item_bfury', // 强袭巨斧
        'item_manta', // 曼塔风格
        'item_hand_of_group', // 团队之手
      ],
      [ItemTier.T3]: [
        'item_wasp_callous', // 大核荣耀冷酷
        'item_satanic', // 撒旦之邪力
        'item_butterfly', // 蝴蝶刀
        'item_dodo_desolator', // 破晓升级
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
    template: HeroTemplate.AgilityCarryMelee,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_hand_of_midas', // 金手指
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
  // ===== 敏捷核心英雄(远程) =====

  npc_dota_hero_luna: {
    template: HeroTemplate.AgilityCarryRanged,
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
    template: HeroTemplate.AgilityCarryRanged,
    targetItemsByTier: {
      [ItemTier.T3]: [
        'item_hurricane_pike_2', // 大推推
      ],
      [ItemTier.T4]: [
        'item_monkey_king_bar_2', // 定海神针（tier 归属修正：真实价格属于 T4）
        'item_excalibur', // 圣剑
        'item_satanic_2', // 真·撒旦
        'item_black_king_bar_2', // 真·BKB
      ],
    },
  },

  npc_dota_hero_sniper: {
    template: HeroTemplate.AgilityCarryRanged,
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

  npc_dota_hero_windrunner: {
    template: HeroTemplate.AgilityCarryRanged,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_power_treads', // 动力鞋
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 金手指
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

  // ===== 法师核心英雄 =====

  npc_dota_hero_lion: {
    template: HeroTemplate.MagicalCarry,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_tranquil_boots', // 静谧之鞋
        'item_null_talisman', // 空灵挂件
        'item_hand_of_midas', // 金手指
        'item_magic_wand', // 魔杖
        'item_soul_ring', // 灵魂之戒
        'item_wraith_band', // 怨灵细带
        'item_falcon_blade', // 猎鹰战刃
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
    template: HeroTemplate.MagicalCarry,
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
    template: HeroTemplate.MagicalCarry,
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

  // ===== 力量坦克英雄 =====

  npc_dota_hero_abaddon: {
    template: HeroTemplate.StrengthTank,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_phase_boots', // 相位鞋
        'item_bracer', // 护腕
        'item_vanguard', // 先锋盾
        'item_soul_ring', // 灵魂之戒
        'item_orb_of_corrosion', // 腐蚀之珠
        'item_falcon_blade', // 猎鹰战刃
        'item_wraith_band', // 怨灵细带
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
    template: HeroTemplate.StrengthTank,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_hand_of_midas', // 金手指
        'item_phase_boots', // 相位鞋
        'item_bracer', // 护腕
        'item_vanguard', // 先锋盾
        'item_soul_ring', // 灵魂之戒
        'item_wraith_band', // 怨灵细带
        'item_falcon_blade', // 猎鹰战刃
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
    template: HeroTemplate.StrengthTank,
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

  // ===== 辅助英雄 =====

  // 霍乱之源
  npc_dota_hero_bane: {
    template: HeroTemplate.Support,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_hand_of_midas', // 金手指
        'item_arcane_boots', // 奥术鞋
        'item_null_talisman', // 空灵挂件
        'item_magic_wand', // 魔棒
        'item_soul_ring', // 灵魂之戒
        'item_falcon_blade', // 猎鹰战刃
        'item_wraith_band', // 怨灵细带
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
    template: HeroTemplate.Support,
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
    template: HeroTemplate.Support,
    targetItemsByTier: {
      [ItemTier.T1]: [
        'item_tranquil_boots', // 静谧之鞋
        'item_null_talisman', // 空灵挂件
        'item_magic_wand', // 魔杖
        'item_hand_of_midas', // 金手指
        'item_soul_ring', // 灵魂之戒
        'item_wraith_band', // 怨灵细带
        'item_falcon_blade', // 猎鹰战刃
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
};

/**
 * 获取英雄的出装配置
 * 如果英雄没有配置，返回 undefined，将根据攻击类型自动使用 AgilityCarryMelee 或 AgilityCarryRanged 模板
 */
export function getHeroBuildConfig(heroName: string): HeroBuildConfig | undefined {
  return HeroBuilds[heroName];
}
