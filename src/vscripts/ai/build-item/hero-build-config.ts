/**
 * 英雄出装配置
 * 基于 Tier 驱动的新系统
 */

import { HeroTemplate } from './hero-build-config-template';
import { ItemTier } from './item-tier-config';

/**
 * 英雄出装配置接口（新版本 - 基于 Tier）
 */
export interface HeroBuildConfig {
  /** 使用的模板（必填，用于填充未配置的 tier） */
  template: HeroTemplate;

  /** 基于 Tier 的装备列表（可选） */
  targetItemsByTier?: {
    [tier: number]: string[]; // 装备数组，不按槽位分类
  };
}

/**
 * 所有英雄的出装配置
 * 未配置的英雄将根据攻击类型自动使用 AgilityCarryMelee 或 AgilityCarryRanged 模板
 */
export const HeroBuilds: Record<string, HeroBuildConfig> = {
  // ===== 敏捷核心英雄(远程) =====

  npc_dota_hero_luna: {
    template: HeroTemplate.AgilityCarryRanged,
    targetItemsByTier: {
      [ItemTier.T3]: [
        'item_monkey_king_bar_2', // 定海神针
      ],
      [ItemTier.T4]: [
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
        'item_monkey_king_bar_2', // 定海神针
        'item_hurricane_pike_2', // 大推推
      ],
      [ItemTier.T4]: [
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
        'item_monkey_king_bar_2', // 定海神针
        'item_hurricane_pike_2', // 大推推
      ],
      [ItemTier.T4]: [
        'item_shotgun_v2', // 散弹枪
        'item_satanic_2', // 真·撒旦
        'item_black_king_bar_2', // 真·BKB
      ],
    },
  },

  // ===== 法师核心英雄 =====

  npc_dota_hero_lion: {
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

  npc_dota_hero_axe: {
    template: HeroTemplate.StrengthTank,
    targetItemsByTier: {
      [ItemTier.T3]: [
        'item_blade_mail_2', // 真·刃甲
        'item_radiance_2', // 大辉耀
      ],
      [ItemTier.T4]: [
        'item_undying_heart', // 不朽之心
        'item_shivas_guard_2', // 希瓦的守护2
        'item_black_king_bar_2', // 真·BKB
        'item_jump_jump_jump', // 跳跳跳刀
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

  npc_dota_hero_abaddon: {
    template: HeroTemplate.StrengthTank,
    targetItemsByTier: {
      [ItemTier.T3]: [
        'item_radiance_2', // 大辉耀 圣焰之光
        'item_overwhelming_blink', // 力量跳刀
        'item_blade_mail_2', // 真·刃甲
        'item_vladmir_2', // 真·祭品
      ],
      [ItemTier.T4]: [
        'item_shivas_guard_2', // 希瓦的守护2
        'item_insight_armor', // 洞察护甲
        'item_saint_orb', // 圣球
        'item_jump_jump_jump', // 跳跳跳刀
      ],
    },
  },

  // ===== 辅助英雄 =====

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
};

/**
 * 获取英雄的出装配置
 * 如果英雄没有配置，返回 undefined，将根据攻击类型自动使用 AgilityCarryMelee 或 AgilityCarryRanged 模板
 */
export function getHeroBuildConfig(heroName: string): HeroBuildConfig | undefined {
  return HeroBuilds[heroName];
}
