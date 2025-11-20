/**
 * 英雄出装配置
 * 定义每个英雄的目标装备
 */

import { HeroTemplate } from './hero-template-config';
import { ItemSlot } from './item-tier-config';

/**
 * 英雄出装配置接口
 */
export interface HeroBuildConfig {
  /** 使用的模板(可选,如果不指定则需要完全自定义) */
  template?: HeroTemplate;
  /** 目标装备配置(槽位 -> 装备名称,完全可选) */
  targetItems?: Partial<Record<ItemSlot, string | string[]>>;
}

/**
 * 所有英雄的出装配置
 * 未配置的英雄将使用默认的PhysicalCarry模板
 */
export const HeroBuilds: Record<string, HeroBuildConfig> = {
  // ===== 物理核心英雄示例 =====

  npc_dota_hero_luna: {
    template: HeroTemplate.PhysicalCarry,
    targetItems: {
      [ItemSlot.Core]: [
        'item_excalibur', // 核心输出槽1: 圣剑
        'item_monkey_king_bar_2', // 核心输出槽2: 定海神针
        'item_skadi_2', // 核心输出槽3: 大冰眼
      ],
      [ItemSlot.Defense]: 'item_satanic_2', // 防御槽: 真·撒旦
      [ItemSlot.Utility]: 'item_black_king_bar_2', // 工具槽: 真·BKB
      // 不设置Mobility槽 - 后期不需要移动装备
    },
  },

  npc_dota_hero_drow_ranger: {
    template: HeroTemplate.PhysicalCarry,
    targetItems: {
      [ItemSlot.Core]: ['item_excalibur', 'item_monkey_king_bar_2', 'item_hurricane_pike_2'],
      [ItemSlot.Defense]: 'item_satanic_2',
      [ItemSlot.Utility]: 'item_black_king_bar_2',
    },
  },

  npc_dota_hero_sniper: {
    template: HeroTemplate.PhysicalCarry,
    targetItems: {
      [ItemSlot.Core]: [
        'item_shotgun_v2', // 散弹枪
        'item_monkey_king_bar_2',
        'item_hurricane_pike_2',
      ],
      [ItemSlot.Defense]: 'item_satanic_2',
      [ItemSlot.Utility]: 'item_black_king_bar_2',
    },
  },

  // ===== 法师核心英雄示例 =====

  npc_dota_hero_lion: {
    template: HeroTemplate.MagicalCarry,
    targetItems: {
      [ItemSlot.Core]: 'item_hallowed_scepter', // 神圣魔法权杖
      [ItemSlot.Control]: 'item_necronomicon_staff', // 死灵法师权杖
      [ItemSlot.Utility]: 'item_refresh_core', // 熔火核心
      [ItemSlot.Defense]: 'item_aeon_pendant', // 永恒坠饰
      [ItemSlot.Mobility]: 'item_arcane_blink', // 大智力跳刀
    },
  },

  npc_dota_hero_lina: {
    template: HeroTemplate.MagicalCarry,
    targetItems: {
      [ItemSlot.Core]: 'item_hallowed_scepter',
      [ItemSlot.Control]: 'item_necronomicon_staff',
      [ItemSlot.Utility]: 'item_refresh_core',
      [ItemSlot.Mobility]: 'item_arcane_blink',
    },
  },

  npc_dota_hero_shadow_shaman: {
    template: HeroTemplate.MagicalCarry,
    targetItems: {
      [ItemSlot.Core]: 'item_hallowed_scepter',
      [ItemSlot.Control]: 'item_necronomicon_staff',
      [ItemSlot.Utility]: 'item_refresh_core',
      [ItemSlot.Defense]: 'item_aeon_pendant',
      [ItemSlot.Mobility]: 'item_arcane_blink',
    },
  },

  // ===== 坦克英雄示例 =====

  npc_dota_hero_axe: {
    template: HeroTemplate.Tank,
    targetItems: {
      [ItemSlot.Defense]: [
        'item_blade_mail_2', // 真·刃甲
        'item_undying_heart', // 不朽之心
        'item_shivas_guard_2', // 希瓦的守护2
      ],
      [ItemSlot.Core]: 'item_radiance_2', // 大辉耀
      [ItemSlot.Utility]: 'item_black_king_bar_2', // 真·BKB
      [ItemSlot.Mobility]: 'item_jump_jump_jump', // 跳跳跳刀
    },
  },

  npc_dota_hero_pudge: {
    template: HeroTemplate.Tank,
    targetItems: {
      [ItemSlot.Defense]: [
        'item_blade_mail_2',
        'item_undying_heart',
        'item_eternal_shroud_ultra', // 法师泳衣
      ],
      [ItemSlot.Core]: 'item_radiance_2',
      [ItemSlot.Utility]: 'item_black_king_bar_2',
      [ItemSlot.Mobility]: 'item_overwhelming_blink_2', // 大力量跳刀
    },
  },

  // ===== 辅助英雄示例 =====

  npc_dota_hero_crystal_maiden: {
    template: HeroTemplate.Support,
    targetItems: {
      [ItemSlot.Core]: 'item_hallowed_scepter',
      [ItemSlot.Control]: 'item_necronomicon_staff',
      [ItemSlot.Utility]: ['item_refresh_core', 'item_aether_lens_2'],
      [ItemSlot.Defense]: 'item_aeon_pendant',
      // 不设置Mobility - 辅助后期不需要移动装备
    },
  },
};

/**
 * 获取英雄的出装配置
 * 如果英雄没有配置,返回undefined,将使用默认PhysicalCarry模板
 */
export function getHeroBuildConfig(heroName: string): HeroBuildConfig | undefined {
  return HeroBuilds[heroName];
}

/**
 * 获取英雄的目标装备列表(特定槽位)
 */
export function getHeroTargetItems(heroName: string, slot: ItemSlot): string[] | undefined {
  const config = HeroBuilds[heroName];
  if (!config || !config.targetItems) {
    return undefined;
  }

  const items = config.targetItems[slot];
  if (!items) {
    return undefined;
  }

  // 如果是字符串,转换为数组
  return typeof items === 'string' ? [items] : items;
}
