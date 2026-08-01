/**
 * 英雄模板配置
 * 定义不同类型英雄的推荐装备链
 */

import { ItemTier } from './item-tier-config';
import { CandidatePoolEntry } from './weighted-pool';

/**
 * 英雄模板类型枚举
 * 按英雄真实主属性（AttributePrimary）划分，与出装的属性三选一配件（护腕/怨灵系带/空灵挂件）匹配
 */
export enum HeroTemplate {
  /** 力量 */
  Strength = 'Strength',
  /** 敏捷 */
  Agility = 'Agility',
  /** 智力 */
  Intelligence = 'Intelligence',
  /** 全才(ALL) */
  Universal = 'Universal',
}

/**
 * 英雄模板配置接口
 */
export interface HeroTemplateConfig {
  /** 模板名称 */
  name: HeroTemplate;
  /** 按 tier 组织的装备列表 */
  itemsByTier: Partial<Record<ItemTier, CandidatePoolEntry[]>>;
  /** 按 tier 组织的消耗品列表（可选） */
  consumablesByTier?: Partial<Record<ItemTier, string[]>>;
}

/**
 * 力量模板
 * 适用于: Axe, Pudge, Sven等
 */
const StrengthTemplate: HeroTemplateConfig = {
  name: HeroTemplate.Strength,
  itemsByTier: {
    [ItemTier.T1]: [
      'item_phase_boots', // 相位鞋
      'item_bracer', // 护腕
      'item_vanguard', // 先锋盾
    ],
    [ItemTier.T2]: [
      'item_blink', // 闪烁匕首
      'item_blade_mail', // 刃甲
      'item_echo_sabre_2', // 回音战刃2
      'item_radiance', // 辉耀
      'item_black_king_bar', // 黑皇杖
    ],
    [ItemTier.T3]: [
      'item_overwhelming_blink', // 力量跳刀
      'item_blade_mail_2', // 刃甲2
      'item_heart', // 龙心
      'item_radiance_2', // 辉耀2
    ],
    [ItemTier.T4]: [
      'item_black_king_bar_2', // 黑皇杖2
      'item_jump_jump_jump', // 跳跳跳刀
      'item_insight_armor', // 洞察护甲
      'item_undying_heart', // 不朽之心
      'item_abyssal_blade_v2', // 一闪
      'item_shivas_guard_2', // 希瓦的守护2
    ],
    [ItemTier.T5]: [
      'item_beast_shield', // 兽化盾
      'item_beast_armor', // 兽化甲
      'item_withered_spring', // 生命之心
    ],
  },
  consumablesByTier: {
    [ItemTier.T1]: ['item_blood_grenade'], // 血腥榴弹
    [ItemTier.T2]: [
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_wings_of_haste', // 急速之翼
    ],
    [ItemTier.T3]: [
      'item_ultimate_scepter_2', // 真阿哈利姆神杖
      'item_moon_shard_datadriven', // 真银月之晶
    ],
    [ItemTier.T4]: ['item_tome_of_strength'], // 力量之书
    [ItemTier.T5]: [],
  },
};

/**
 * 敏捷模板
 * 适用于: PA, Riki, Luna, Drow, Sniper等敏捷英雄（近战/远程共用，差异化留给英雄专属池）
 */
const AgilityTemplate: HeroTemplateConfig = {
  name: HeroTemplate.Agility,
  itemsByTier: {
    [ItemTier.T1]: [
      'item_power_treads', // 动力鞋
      'item_wraith_band', // 怨灵细带
      'item_vanguard', // 先锋盾
      'item_mask_of_madness', // 疯狂面具
    ],
    [ItemTier.T2]: [
      'item_sange_and_yasha', // 散夜对剑
      'item_monkey_king_bar', // 金箍棒
      'item_black_king_bar', // 黑皇杖
    ],
    [ItemTier.T3]: [
      'item_wasp_callous', // 大核荣耀冷酷
      'item_satanic', // 撒旦之邪力
      'item_monkey_king_bar_2', // 定海神针
    ],
    [ItemTier.T4]: [
      'item_black_king_bar_2', // 黑皇杖2
      'item_wasp_golden', // 黄金大核荣耀
      'item_infernal_desolator', // 绝对破防之刃
      'item_excalibur', // EX咖喱棒
      'item_abyssal_blade_v2', // 一闪
      'item_satanic_2', // 撒旦之邪力2
    ],
    [ItemTier.T5]: [
      'item_rapier_ultra_bot_1', // 圣剑终极版
      'item_magic_sword', // 魔渊剑
      'item_switchable_crit_blade', // 归海一刀
      'item_hawkeye_turret', // 鹰眼炮台
    ],
  },
  consumablesByTier: {
    [ItemTier.T1]: ['item_blood_grenade'], // 血腥榴弹
    [ItemTier.T2]: [
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_wings_of_haste', // 急速之翼
    ],
    [ItemTier.T3]: [
      'item_ultimate_scepter_2', // 真阿哈利姆神杖
    ],
    [ItemTier.T4]: ['item_tome_of_agility'], // 敏捷之书
    [ItemTier.T5]: [],
  },
};

/**
 * 智力模板
 * 适用于: Lion, Lina, Shadow Shaman, Crystal Maiden, Lich等智力英雄（核心/辅助共用，差异化留给英雄专属池）
 */
const IntelligenceTemplate: HeroTemplateConfig = {
  name: HeroTemplate.Intelligence,
  itemsByTier: {
    [ItemTier.T1]: [
      'item_arcane_boots', // 奥术鞋
      'item_null_talisman', // 空灵挂件
      'item_hand_of_midas', // 点金手
      'item_tranquil_boots', // 静谧之鞋
      'item_magic_wand', // 魔棒
    ],
    [ItemTier.T2]: [
      'item_octarine_core', // 玲珑心
      'item_rod_of_atos', // 阿托斯之棍
      'item_glimmer_cape', // 微光披风
      'item_force_staff', // 原力法杖
      'item_aether_lens_2', // 以太透镜2
      'item_aeon_disk', // 永恒之盘
      'item_refresher', // 刷新球（tier 归属修正：真实价格属于 T2）
      'item_holy_locket', // 圣洁吊坠
      'item_hand_of_group', // 团队之手
      'item_guardian_greaves', // 卫士胫甲（tier 归属修正：真实价格属于 T2）
    ],
    [ItemTier.T3]: [
      'item_arcane_blink_2', // 奥术闪烁2
      'item_magic_scepter', // 魔法权杖
      'item_sheepstick', // 邪恶镰刀
      'item_aeon_pendant', // 永恒吊坠
      'item_orb_of_the_brine', // 苍洋魔珠
    ],
    [ItemTier.T4]: [
      'item_arcane_blink', // 奥术闪烁
      'item_hallowed_scepter', // 仙云法杖
      'item_necronomicon_staff', // 死灵法杖
      'item_refresh_core', // 熔火核心
      'item_shivas_guard_2', // 希瓦的守护2
      'item_gungir_2', // 风暴之锤
      'item_guardian_greaves_artifact', // 神器 卫士胫甲
    ],
    [ItemTier.T5]: [
      'item_time_gem', // 时间宝石
      'item_magic_crit_blade', // 魔龙狂舞
    ],
  },
  consumablesByTier: {
    [ItemTier.T1]: ['item_infused_raindrop'], // 凝魂之露
    [ItemTier.T2]: [
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_wings_of_haste', // 急速之翼
    ],
    [ItemTier.T3]: ['item_ultimate_scepter_2'], // 真阿哈利姆神杖
    [ItemTier.T4]: ['item_tome_of_intelligence'], // 智力之书
    [ItemTier.T5]: [],
  },
};

/**
 * 全才模板
 * 适用于: AttributePrimary 为 ALL 的英雄。不含护腕/怨灵系带/空灵挂件这类属性三选一配件
 * （无法判断该倾向哪个属性），只用不依赖单一属性的中性装备与常规强力装备线
 */
const UniversalTemplate: HeroTemplateConfig = {
  name: HeroTemplate.Universal,
  itemsByTier: {
    [ItemTier.T1]: [
      'item_power_treads', // 动力鞋
      'item_magic_wand', // 魔棒
      'item_hand_of_midas', // 点金手
      'item_vanguard', // 先锋盾
    ],
    [ItemTier.T2]: [
      'item_black_king_bar', // 黑皇杖
      'item_sange_and_yasha', // 散夜对剑
      'item_force_staff', // 原力法杖
      'item_blink', // 闪烁匕首
      'item_aether_lens_2', // 以太透镜2
    ],
    [ItemTier.T3]: [
      'item_satanic', // 撒旦之邪力
      'item_aeon_pendant', // 永恒吊坠
      'item_blade_mail_2', // 刃甲2
    ],
    [ItemTier.T4]: [
      'item_black_king_bar_2', // 天神杖
      'item_refresh_core', // 熔火核心
      'item_excalibur', // EX咖喱棒
      'item_shivas_guard_2', // 希瓦的守护2
    ],
    [ItemTier.T5]: [
      'item_time_gem', // 时间宝石
      'item_switchable_crit_blade', // 归海一刀
    ],
  },
  consumablesByTier: {
    [ItemTier.T2]: [
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_wings_of_haste', // 急速之翼
    ],
    [ItemTier.T3]: ['item_ultimate_scepter_2'], // 真阿哈利姆神杖
    [ItemTier.T5]: [],
  },
};

/**
 * 主属性对三种属性之书的加权（供 tome 阶段循环购买使用）
 * 全才（Attributes.ALL）三者均分
 */
export const PrimaryAttributeTomeWeights: Record<
  Attributes,
  Record<'strength' | 'agility' | 'intelligence', number>
> = {
  [Attributes.STRENGTH]: { strength: 0.5, agility: 0.25, intelligence: 0.25 },
  [Attributes.AGILITY]: { strength: 0.25, agility: 0.5, intelligence: 0.25 },
  [Attributes.INTELLECT]: { strength: 0.25, agility: 0.25, intelligence: 0.5 },
  [Attributes.ALL]: { strength: 1 / 3, agility: 1 / 3, intelligence: 1 / 3 },
} as Record<Attributes, Record<'strength' | 'agility' | 'intelligence', number>>;

/**
 * 根据难度倍率获取 tome 购买上限（不含洛书）
 */
export function GetTomePurchaseCap(multiplier: number): number {
  if (multiplier < 3) {
    return 6;
  } else if (multiplier < 6) {
    return 12;
  } else if (multiplier < 10) {
    return 20;
  } else if (multiplier < 15) {
    return 30;
  } else {
    return 60;
  }
}

/**
 * 所有英雄模板配置
 */
export const HeroTemplates: Record<HeroTemplate, HeroTemplateConfig> = {
  [HeroTemplate.Strength]: StrengthTemplate,
  [HeroTemplate.Agility]: AgilityTemplate,
  [HeroTemplate.Intelligence]: IntelligenceTemplate,
  [HeroTemplate.Universal]: UniversalTemplate,
};

/**
 * 根据模板类型获取模板配置
 */
export function getHeroTemplate(template: HeroTemplate): HeroTemplateConfig | undefined {
  return HeroTemplates[template];
}

/**
 * 根据模板和 tier 获取推荐装备列表
 */
export function getTemplateItemsByTier(
  template: HeroTemplate,
  tier: ItemTier,
): CandidatePoolEntry[] {
  const templateConfig = HeroTemplates[template];
  if (!templateConfig) {
    return [];
  }

  return templateConfig.itemsByTier[tier] || [];
}

/**
 * 根据模板和 tier 获取消耗品列表
 */
export function getTemplateConsumablesByTier(template: HeroTemplate, tier: ItemTier): string[] {
  const templateConfig = HeroTemplates[template];
  if (!templateConfig || !templateConfig.consumablesByTier) {
    return [];
  }

  return templateConfig.consumablesByTier[tier] || [];
}
