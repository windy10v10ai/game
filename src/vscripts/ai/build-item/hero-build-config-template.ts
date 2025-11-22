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
      'item_boots', // 鞋子
      'item_power_treads', // 动力鞋
      'item_wraith_band', // 怨灵细带
      'item_mask_of_madness', // 疯狂面具
      'item_vanguard', // 先锋盾
    ],
    [ItemTier.T2]: [
      'item_sange_and_yasha', // 散夜对剑
      'item_monkey_king_bar', // 金箍棒
      'item_black_king_bar', // 黑皇杖
    ],
    [ItemTier.T3]: [
      'item_monkey_king_bar_2', // 金箍棒2
      'item_satanic', // 撒旦之邪力
    ],
    [ItemTier.T4]: [
      'item_excalibur', // EX咖喱棒
      'item_satanic_2', // 撒旦之邪力2
      'item_black_king_bar_2', // 黑皇杖2
    ],
    [ItemTier.T5]: ['item_rapier_ultra_bot_1'], // 圣剑终极版
  },
  consumablesByTier: {
    [ItemTier.T1]: [
      'item_blood_grenade', // 血腥榴弹
      'item_faerie_fire', // 仙灵之火
    ],
    [ItemTier.T2]: [
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_wings_of_haste', // 急速之翼
    ],
    [ItemTier.T3]: [
      'item_ultimate_scepter_2', // 真阿哈利姆神杖
      'item_moon_shard_datadriven', // 真银月之晶
    ],
    [ItemTier.T4]: ['item_tome_of_agility'], // 敏捷之书
    [ItemTier.T5]: ['item_tome_of_luoshu'], // 洛书
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
      'item_boots', // 鞋子
      'item_power_treads', // 动力鞋
      'item_wraith_band', // 怨灵细带
      'item_mask_of_madness', // 疯狂面具
      'item_vanguard', // 先锋盾
    ],
    [ItemTier.T2]: [
      'item_sange_and_yasha', // 散夜对剑
      'item_monkey_king_bar', // 金箍棒
      'item_black_king_bar', // 黑皇杖
    ],
    [ItemTier.T3]: [
      'item_monkey_king_bar_2', // 金箍棒2
      'item_satanic', // 撒旦之邪力
    ],
    [ItemTier.T4]: [
      'item_excalibur', // EX咖喱棒
      'item_satanic_2', // 撒旦之邪力2
      'item_black_king_bar_2', // 黑皇杖2
    ],
    [ItemTier.T5]: ['item_rapier_ultra_bot_1'], // 圣剑终极版
  },
  consumablesByTier: {
    [ItemTier.T1]: [
      'item_blood_grenade', // 血腥榴弹
      'item_faerie_fire', // 仙灵之火
    ],
    [ItemTier.T2]: [
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_wings_of_haste', // 急速之翼
    ],
    [ItemTier.T3]: [
      'item_ultimate_scepter_2', // 真阿哈利姆神杖
      'item_moon_shard_datadriven', // 真银月之晶
    ],
    [ItemTier.T4]: ['item_tome_of_agility'], // 敏捷之书
    [ItemTier.T5]: ['item_tome_of_luoshu'], // 洛书
  },
};

/**
 * 法师核心模板
 * 适用于: Lion, Lina, Zeus, Shadow Shaman等
 */
const MagicalCarryTemplate: HeroTemplateConfig = {
  name: HeroTemplate.MagicalCarry,
  itemsByTier: {
    [ItemTier.T1]: [
      'item_boots', // 鞋子
      'item_arcane_boots', // 奥术鞋
      'item_null_talisman', // 空灵挂件
    ],
    [ItemTier.T2]: [
      'item_blink', // 闪烁匕首
      'item_kaya', // 慧光
      'item_octarine_core', // 玲珑心
      'item_rod_of_atos', // 阿托斯之棍
      'item_glimmer_cape', // 微光披风
      'item_force_staff', // 原力法杖
      'item_aether_lens_2', // 以太透镜2
      'item_aeon_disk', // 永恒之盘
    ],
    [ItemTier.T3]: [
      'item_arcane_blink_2', // 奥术闪烁2
      'item_magic_scepter', // 魔法权杖
      'item_sheepstick', // 邪恶镰刀
      'item_refresher', // 刷新球
      'item_aeon_pendant', // 永恒吊坠
    ],
    [ItemTier.T4]: [
      'item_arcane_blink', // 奥术闪烁
      'item_hallowed_scepter', // 神圣权杖
      'item_necronomicon_staff', // 死灵书法杖
      'item_refresh_core', // 刷新核心
    ],
  },
  consumablesByTier: {
    [ItemTier.T1]: [
      'item_enchanted_mango', // 魔法芒果
      'item_infused_raindrop', // 凝魂之露
    ],
    [ItemTier.T2]: [
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_wings_of_haste', // 急速之翼
    ],
    [ItemTier.T3]: ['item_ultimate_scepter_2'], // 真阿哈利姆神杖
    [ItemTier.T4]: ['item_tome_of_intelligence'], // 智力之书
    [ItemTier.T5]: ['item_tome_of_luoshu'], // 洛书
  },
};

/**
 * 力量坦克模板
 * 适用于: Axe, Pudge, Bristleback, Centaur等
 */
const StrengthTankTemplate: HeroTemplateConfig = {
  name: HeroTemplate.StrengthTank,
  itemsByTier: {
    [ItemTier.T1]: [
      'item_boots', // 鞋子
      'item_phase_boots', // 相位鞋
      'item_bracer', // 护腕
      'item_vanguard', // 先锋盾
    ],
    [ItemTier.T2]: [
      'item_blink', // 闪烁匕首
      'item_blade_mail', // 刃甲
      'item_echo_sabre', // 回音战刃
      'item_echo_sabre_2', // 回音战刃2
      'item_radiance', // 辉耀
      'item_black_king_bar', // 黑皇杖
    ],
    [ItemTier.T3]: [
      'item_overwhelming_blink', // 压倒性闪烁
      'item_blade_mail_2', // 刃甲2
      'item_heart', // 龙心
      'item_radiance_2', // 辉耀2
    ],
    [ItemTier.T4]: [
      'item_overwhelming_blink_2', // 压倒性闪烁2
      'item_jump_jump_jump', // 三连跳
      'item_undying_heart', // 不朽之心
      'item_shivas_guard_2', // 希瓦的守护2
      'item_black_king_bar_2', // 黑皇杖2
    ],
  },
  consumablesByTier: {
    [ItemTier.T1]: [
      'item_blood_grenade', // 血腥榴弹
      'item_faerie_fire', // 仙灵之火
    ],
    [ItemTier.T2]: [
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_wings_of_haste', // 急速之翼
    ],
    [ItemTier.T3]: ['item_ultimate_scepter_2'], // 真阿哈利姆神杖
    [ItemTier.T4]: ['item_tome_of_strength'], // 力量之书
    [ItemTier.T5]: ['item_tome_of_luoshu'], // 洛书
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
      'item_boots', // 鞋子
      'item_arcane_boots', // 奥术鞋
      'item_tranquil_boots', // 静谧之鞋
      'item_magic_wand', // 魔棒
      'item_null_talisman', // 空灵挂件
    ],
    [ItemTier.T2]: [
      'item_glimmer_cape', // 微光披风
      'item_force_staff', // 原力法杖
      'item_holy_locket', // 圣洁吊坠
      'item_aether_lens_2', // 以太透镜2
      'item_rod_of_atos', // 阿托斯之棍
      'item_kaya', // 慧光
      'item_aeon_disk', // 永恒之盘
    ],
    [ItemTier.T3]: [
      'item_guardian_greaves', // 卫士胫甲
      'item_sheepstick', // 邪恶镰刀
      'item_aeon_pendant', // 永恒吊坠
    ],
  },
  consumablesByTier: {
    [ItemTier.T1]: [
      'item_enchanted_mango', // 魔法芒果
      'item_infused_raindrop', // 凝魂之露
    ],
    [ItemTier.T2]: [
      'item_aghanims_shard', // 阿哈利姆魔晶
      'item_wings_of_haste', // 急速之翼
    ],
    [ItemTier.T3]: ['item_ultimate_scepter_2'], // 真阿哈利姆神杖
    [ItemTier.T5]: ['item_tome_of_luoshu'], // 洛书
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
