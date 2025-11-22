/**
 * 英雄模板配置
 * 定义不同类型英雄的推荐装备链
 */

import { ItemSlot } from './item-tier-config';

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
 * 装备槽位的推荐装备链
 * 从低tier到高tier的装备列表
 */
export interface SlotItemChain {
  /** 槽位类型 */
  slot: ItemSlot;
  /** 推荐装备链(从低tier到高tier) */
  items: string[];
}

/**
 * 英雄模板配置接口
 */
export interface HeroTemplateConfig {
  /** 模板名称 */
  name: HeroTemplate;
  /** 各槽位的推荐装备链 */
  itemChains: SlotItemChain[];
}

/**
 * 敏捷核心模板(近战)
 * 适用于: PA, Juggernaut, Riki等近战敏捷英雄
 */
const AgilityCarryMeleeTemplate: HeroTemplateConfig = {
  name: HeroTemplate.AgilityCarryMelee,
  itemChains: [
    {
      slot: ItemSlot.Mobility,
      items: [
        'item_boots', // T1: 草鞋
        'item_power_treads', // T1: 动力鞋
      ],
    },
    {
      slot: ItemSlot.Core,
      items: [
        'item_wraith_band', // T1: 系带
        'item_mask_of_madness', // T1: 疯脸
        'item_sange_and_yasha', // T2: 散夜对剑
        'item_monkey_king_bar', // T2: 金箍棒
        'item_monkey_king_bar_2', // T3: 定海神针
        'item_excalibur', // T4: 圣剑
        'item_rapier_ultra_bot_1', // T5: 真·圣剑(Bot专用)
      ],
    },
    {
      slot: ItemSlot.Defense,
      items: [
        'item_vanguard', // T1: 先锋盾
        'item_satanic', // T3: 撒旦
        'item_satanic_2', // T4: 真·撒旦
      ],
    },
    {
      slot: ItemSlot.Utility,
      items: [
        'item_black_king_bar', // T2: BKB
        'item_black_king_bar_2', // T4: 真·BKB
      ],
    },
    {
      slot: ItemSlot.Consumable,
      items: [
        'item_aghanims_shard', // T2: 魔晶
        'item_wings_of_haste', // T2: 急速之翼
        'item_ultimate_scepter_2', // T3: 真·阿哈利姆神杖
        'item_moon_shard_datadriven', // T3: 月之晶
      ],
    },
  ],
};

/**
 * 敏捷核心模板(远程)
 * 适用于: Luna, Drow, Sniper等远程敏捷英雄
 */
const AgilityCarryRangedTemplate: HeroTemplateConfig = {
  name: HeroTemplate.AgilityCarryRanged,
  itemChains: [
    {
      slot: ItemSlot.Mobility,
      items: [
        'item_boots', // T1: 草鞋
        'item_power_treads', // T1: 动力鞋
      ],
    },
    {
      slot: ItemSlot.Core,
      items: [
        'item_wraith_band', // T1: 系带
        'item_mask_of_madness', // T1: 疯脸
        'item_sange_and_yasha', // T2: 散夜对剑
        'item_monkey_king_bar', // T2: 金箍棒
        'item_monkey_king_bar_2', // T3: 定海神针
        'item_excalibur', // T4: 圣剑
        'item_rapier_ultra_bot_1', // T5: 真·圣剑(Bot专用)
      ],
    },
    {
      slot: ItemSlot.Defense,
      items: [
        'item_vanguard', // T1: 先锋盾
        'item_satanic', // T3: 撒旦
        'item_satanic_2', // T4: 真·撒旦
      ],
    },
    {
      slot: ItemSlot.Utility,
      items: [
        'item_black_king_bar', // T2: BKB
        'item_black_king_bar_2', // T4: 真·BKB
      ],
    },
    {
      slot: ItemSlot.Consumable,
      items: [
        'item_aghanims_shard', // T2: 魔晶
        'item_wings_of_haste', // T2: 急速之翼
        'item_ultimate_scepter_2', // T3: 真·阿哈利姆神杖
        'item_moon_shard_datadriven', // T3: 月之晶
      ],
    },
  ],
};

/**
 * 法师核心模板
 * 适用于: Lion, Lina, Zeus, Shadow Shaman等
 */
const MagicalCarryTemplate: HeroTemplateConfig = {
  name: HeroTemplate.MagicalCarry,
  itemChains: [
    {
      slot: ItemSlot.Mobility,
      items: [
        'item_boots', // T1: 草鞋
        'item_arcane_boots', // T1: 秘法鞋
        'item_blink', // T2: 跳刀
        'item_arcane_blink_2', // T3: 智力跳刀
        'item_arcane_blink', // T4: 大智力跳刀
      ],
    },
    {
      slot: ItemSlot.Core,
      items: [
        'item_null_talisman', // T1: 挂件
        'item_kaya', // T2: 慧光
        'item_octarine_core', // T2: 玲珑心
        'item_magic_scepter', // T3: 魔法权杖
        'item_hallowed_scepter', // T4: 神圣魔法权杖
      ],
    },
    {
      slot: ItemSlot.Control,
      items: [
        'item_rod_of_atos', // T2: 阿托斯之棍
        'item_sheepstick', // T3: 羊刀
        'item_necronomicon_staff', // T4: 死灵法师权杖
      ],
    },
    {
      slot: ItemSlot.Utility,
      items: [
        'item_glimmer_cape', // T2: 微光
        'item_force_staff', // T2: 推推棒
        'item_aether_lens_2', // T2: 以太透镜2
        'item_refresher', // T3: 刷新球
        'item_refresh_core', // T4: 熔火核心
      ],
    },
    {
      slot: ItemSlot.Defense,
      items: [
        'item_aeon_disk', // T2: 永恒之盘
        'item_aeon_pendant', // T3: 永恒坠饰
      ],
    },
    {
      slot: ItemSlot.Consumable,
      items: [
        'item_aghanims_shard', // T2: 魔晶
        'item_ultimate_scepter_2', // T3: 真·阿哈利姆神杖
      ],
    },
  ],
};

/**
 * 力量坦克模板
 * 适用于: Axe, Pudge, Bristleback, Centaur等
 */
const StrengthTankTemplate: HeroTemplateConfig = {
  name: HeroTemplate.StrengthTank,
  itemChains: [
    {
      slot: ItemSlot.Mobility,
      items: [
        'item_boots', // T1: 草鞋
        'item_phase_boots', // T1: 相位鞋
        'item_blink', // T2: 跳刀
        'item_overwhelming_blink', // T3: 力量跳刀
        'item_overwhelming_blink_2', // T4: 大力量跳刀
        'item_jump_jump_jump', // T4: 跳跳跳刀
      ],
    },
    {
      slot: ItemSlot.Defense,
      items: [
        'item_bracer', // T1: 护腕
        'item_vanguard', // T1: 先锋盾
        'item_blade_mail', // T2: 刃甲
        'item_blade_mail_2', // T3: 真·刃甲
        'item_heart', // T3: 龙心
        'item_undying_heart', // T4: 不朽之心
        'item_shivas_guard_2', // T4: 希瓦的守护2
      ],
    },
    {
      slot: ItemSlot.Core,
      items: [
        'item_echo_sabre', // T2: 回音刃
        'item_echo_sabre_2', // T2: 音速战刃
        'item_radiance', // T2: 辉耀
        'item_radiance_2', // T3: 大辉耀
      ],
    },
    {
      slot: ItemSlot.Utility,
      items: [
        'item_black_king_bar', // T2: BKB
        'item_black_king_bar_2', // T4: 真·BKB
      ],
    },
    {
      slot: ItemSlot.Consumable,
      items: [
        'item_aghanims_shard', // T2: 魔晶
        'item_wings_of_haste', // T2: 急速之翼
        'item_ultimate_scepter_2', // T3: 真·阿哈利姆神杖
      ],
    },
  ],
};

/**
 * 辅助模板
 * 适用于: Crystal Maiden, Dazzle, Warlock等
 */
const SupportTemplate: HeroTemplateConfig = {
  name: HeroTemplate.Support,
  itemChains: [
    {
      slot: ItemSlot.Mobility,
      items: [
        'item_boots', // T1: 草鞋
        'item_arcane_boots', // T1: 秘法鞋
        'item_tranquil_boots', // T1: 绿鞋
      ],
    },
    {
      slot: ItemSlot.Utility,
      items: [
        'item_magic_wand', // T1: 魔杖
        'item_glimmer_cape', // T2: 微光
        'item_force_staff', // T2: 推推棒
        'item_holy_locket', // T2: 圣洁吊坠
        'item_aether_lens_2', // T2: 以太透镜2
        'item_guardian_greaves', // T3: 卫士胫甲
      ],
    },
    {
      slot: ItemSlot.Control,
      items: [
        'item_rod_of_atos', // T2: 阿托斯之棍
        'item_sheepstick', // T3: 羊刀
      ],
    },
    {
      slot: ItemSlot.Core,
      items: [
        'item_null_talisman', // T1: 挂件
        'item_kaya', // T2: 慧光
      ],
    },
    {
      slot: ItemSlot.Defense,
      items: [
        'item_aeon_disk', // T2: 永恒之盘
        'item_aeon_pendant', // T3: 永恒坠饰
      ],
    },
    {
      slot: ItemSlot.Consumable,
      items: [
        'item_aghanims_shard', // T2: 魔晶
        'item_ultimate_scepter_2', // T3: 真·阿哈利姆神杖
      ],
    },
  ],
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
 * 根据模板和槽位获取推荐装备链
 */
export function getTemplateItemChain(template: HeroTemplate, slot: ItemSlot): string[] | undefined {
  const templateConfig = HeroTemplates[template];
  if (!templateConfig) {
    return undefined;
  }

  const chain = templateConfig.itemChains.find((c) => c.slot === slot);
  return chain?.items;
}
