/**
 * 英雄模板配置
 * 定义不同类型英雄的推荐装备链
 */

import { ItemTier } from './item-tier-config';

/**
 * 英雄模板类型枚举
 */
export enum HeroTemplate {
  /** 敏捷核心(近战) - 近战敏捷输出英雄 */
  AgilityCarryMelee = 'AgilityCarryMelee',
  /** 敏捷核心(远程) - 远程敏捷输出英雄 */
  AgilityCarryRanged = 'AgilityCarryRanged',
  /** 法师核心 - 法术输出英雄 */
  MagicalCarry = 'MagicalCarry',
  /** 力量坦克 - 前排力量坦克英雄 */
  StrengthTank = 'StrengthTank',
  /** 辅助 - 辅助英雄 */
  Support = 'Support',
}

/**
 * 英雄模板配置接口
 */
export interface HeroTemplateConfig {
  /** 模板名称 */
  name: HeroTemplate;
  /** 按 tier 组织的装备列表 */
  itemsByTier: Partial<Record<ItemTier, string[]>>;
  /** 按 tier 组织的消耗品列表（可选） */
  consumablesByTier?: Partial<Record<ItemTier, string[]>>;
}

/**
 * 敏捷核心模板(近战)
 * 适用于: PA, Juggernaut, Riki等近战敏捷英雄
 */
const AgilityCarryMeleeTemplate: HeroTemplateConfig = {
  name: HeroTemplate.AgilityCarryMelee,
  itemsByTier: {
    [ItemTier.T1]: [
      'item_boots',
      'item_power_treads',
      'item_wraith_band',
      'item_mask_of_madness',
      'item_vanguard',
    ],
    [ItemTier.T2]: ['item_sange_and_yasha', 'item_monkey_king_bar', 'item_black_king_bar'],
    [ItemTier.T3]: ['item_monkey_king_bar_2', 'item_satanic'],
    [ItemTier.T4]: ['item_excalibur', 'item_satanic_2', 'item_black_king_bar_2'],
    [ItemTier.T5]: ['item_rapier_ultra_bot_1'],
  },
  consumablesByTier: {
    [ItemTier.T2]: ['item_aghanims_shard', 'item_wings_of_haste'],
    [ItemTier.T3]: ['item_ultimate_scepter_2', 'item_moon_shard_datadriven'],
    [ItemTier.T4]: ['item_tome_of_agility'],
    [ItemTier.T5]: ['item_tome_of_luoshu'],
  },
};

/**
 * 敏捷核心模板(远程)
 * 适用于: Luna, Drow, Sniper等远程敏捷英雄
 */
const AgilityCarryRangedTemplate: HeroTemplateConfig = {
  name: HeroTemplate.AgilityCarryRanged,
  itemsByTier: {
    [ItemTier.T1]: [
      'item_boots',
      'item_power_treads',
      'item_wraith_band',
      'item_mask_of_madness',
      'item_vanguard',
    ],
    [ItemTier.T2]: ['item_sange_and_yasha', 'item_monkey_king_bar', 'item_black_king_bar'],
    [ItemTier.T3]: ['item_monkey_king_bar_2', 'item_satanic'],
    [ItemTier.T4]: ['item_excalibur', 'item_satanic_2', 'item_black_king_bar_2'],
    [ItemTier.T5]: ['item_rapier_ultra_bot_1'],
  },
  consumablesByTier: {
    [ItemTier.T2]: ['item_aghanims_shard', 'item_wings_of_haste'],
    [ItemTier.T3]: ['item_ultimate_scepter_2', 'item_moon_shard_datadriven'],
    [ItemTier.T4]: ['item_tome_of_agility'],
    [ItemTier.T5]: ['item_tome_of_luoshu'],
  },
};

/**
 * 法师核心模板
 * 适用于: Lion, Lina, Zeus, Shadow Shaman等
 */
const MagicalCarryTemplate: HeroTemplateConfig = {
  name: HeroTemplate.MagicalCarry,
  itemsByTier: {
    [ItemTier.T1]: ['item_boots', 'item_arcane_boots', 'item_null_talisman'],
    [ItemTier.T2]: [
      'item_blink',
      'item_kaya',
      'item_octarine_core',
      'item_rod_of_atos',
      'item_glimmer_cape',
      'item_force_staff',
      'item_aether_lens_2',
      'item_aeon_disk',
    ],
    [ItemTier.T3]: [
      'item_arcane_blink_2',
      'item_magic_scepter',
      'item_sheepstick',
      'item_refresher',
      'item_aeon_pendant',
    ],
    [ItemTier.T4]: [
      'item_arcane_blink',
      'item_hallowed_scepter',
      'item_necronomicon_staff',
      'item_refresh_core',
    ],
  },
  consumablesByTier: {
    [ItemTier.T2]: ['item_aghanims_shard', 'item_wings_of_haste'],
    [ItemTier.T3]: ['item_ultimate_scepter_2'],
    [ItemTier.T4]: ['item_tome_of_intelligence'],
    [ItemTier.T5]: ['item_tome_of_luoshu'],
  },
};

/**
 * 力量坦克模板
 * 适用于: Axe, Pudge, Bristleback, Centaur等
 */
const StrengthTankTemplate: HeroTemplateConfig = {
  name: HeroTemplate.StrengthTank,
  itemsByTier: {
    [ItemTier.T1]: ['item_boots', 'item_phase_boots', 'item_bracer', 'item_vanguard'],
    [ItemTier.T2]: [
      'item_blink',
      'item_blade_mail',
      'item_echo_sabre',
      'item_echo_sabre_2',
      'item_radiance',
      'item_black_king_bar',
    ],
    [ItemTier.T3]: [
      'item_overwhelming_blink',
      'item_blade_mail_2',
      'item_heart',
      'item_radiance_2',
    ],
    [ItemTier.T4]: [
      'item_overwhelming_blink_2',
      'item_jump_jump_jump',
      'item_undying_heart',
      'item_shivas_guard_2',
      'item_black_king_bar_2',
    ],
  },
  consumablesByTier: {
    [ItemTier.T2]: ['item_aghanims_shard', 'item_wings_of_haste'],
    [ItemTier.T3]: ['item_ultimate_scepter_2'],
    [ItemTier.T4]: ['item_tome_of_strength'],
    [ItemTier.T5]: ['item_tome_of_luoshu'],
  },
};

/**
 * 辅助模板
 * 适用于: Crystal Maiden, Dazzle, Warlock等
 */
const SupportTemplate: HeroTemplateConfig = {
  name: HeroTemplate.Support,
  itemsByTier: {
    [ItemTier.T1]: [
      'item_boots',
      'item_arcane_boots',
      'item_tranquil_boots',
      'item_magic_wand',
      'item_null_talisman',
    ],
    [ItemTier.T2]: [
      'item_glimmer_cape',
      'item_force_staff',
      'item_holy_locket',
      'item_aether_lens_2',
      'item_rod_of_atos',
      'item_kaya',
      'item_aeon_disk',
    ],
    [ItemTier.T3]: ['item_guardian_greaves', 'item_sheepstick', 'item_aeon_pendant'],
  },
  consumablesByTier: {
    [ItemTier.T2]: ['item_aghanims_shard', 'item_wings_of_haste'],
    [ItemTier.T3]: ['item_ultimate_scepter_2'],
    [ItemTier.T5]: ['item_tome_of_luoshu'],
  },
};

/**
 * 所有英雄模板配置
 */
export const HeroTemplates: Record<HeroTemplate, HeroTemplateConfig> = {
  [HeroTemplate.AgilityCarryMelee]: AgilityCarryMeleeTemplate,
  [HeroTemplate.AgilityCarryRanged]: AgilityCarryRangedTemplate,
  [HeroTemplate.MagicalCarry]: MagicalCarryTemplate,
  [HeroTemplate.StrengthTank]: StrengthTankTemplate,
  [HeroTemplate.Support]: SupportTemplate,
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
export function getTemplateItemsByTier(template: HeroTemplate, tier: ItemTier): string[] {
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
