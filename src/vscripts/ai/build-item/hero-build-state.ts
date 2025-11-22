/**
 * 英雄出装运行时状态
 * 状态由 BotBaseAIModifier 管理，不使用全局 Map
 */

import { HeroBuildConfig } from './hero-build-config';
import { getTemplateConsumablesByTier, getTemplateItemsByTier } from './hero-build-config-template';
import { getItemConfig, GetItemPrerequisites, ItemTier } from './item-tier-config';

/**
 * 英雄出装运行时状态
 */
export interface HeroBuildState {
  /** 当前应该购买的 tier */
  currentTier: ItemTier;

  /** 每个 tier 的装备列表（初始化时补全，不包含消耗品） */
  resolvedItems: {
    [tier: number]: string[]; // 装备名数组
  };

  /** 每个 tier 的消耗品列表（独立处理，不设上限） */
  consumables: {
    [tier: number]: string[]; // 消耗品名数组
  };
}

/**
 * 初始化英雄出装
 * @param hero 英雄单位
 * @param config 英雄出装配置
 * @returns 初始化后的出装状态
 */
export function InitializeHeroBuild(
  hero: CDOTA_BaseNPC_Hero,
  config: HeroBuildConfig,
): HeroBuildState {
  const resolvedItems: Record<number, string[]> = {
    [ItemTier.T1]: [],
    [ItemTier.T2]: [],
    [ItemTier.T3]: [],
    [ItemTier.T4]: [],
    [ItemTier.T5]: [],
  };
  const consumables: Record<number, string[]> = {
    [ItemTier.T1]: [],
    [ItemTier.T2]: [],
    [ItemTier.T3]: [],
    [ItemTier.T4]: [],
    [ItemTier.T5]: [],
  };

  // 填充用户配置的装备（最多 6 个）
  FillUserConfigItems(config, resolvedItems, consumables);

  // 使用 template 填充空缺或稀疏的 tier
  FillTemplateItems(config, resolvedItems, consumables);

  // 为高 tier 装备补全前置装备（每个 tier 最多 6 个）
  FillPrerequisiteItems(resolvedItems);

  print(
    `[AI] InitializeHeroBuild ${hero.GetUnitName()} 初始化出装:\n` +
      `  T1: ${resolvedItems[ItemTier.T1].join(', ')}\n` +
      `  T2: ${resolvedItems[ItemTier.T2].join(', ')}\n` +
      `  T3: ${resolvedItems[ItemTier.T3].join(', ')}\n` +
      `  T4: ${resolvedItems[ItemTier.T4].join(', ')}\n` +
      `  T5: ${resolvedItems[ItemTier.T5].join(', ')}\n` +
      `  消耗品 T1: ${consumables[ItemTier.T1].join(', ')}\n` +
      `  消耗品 T2: ${consumables[ItemTier.T2].join(', ')}\n` +
      `  消耗品 T3: ${consumables[ItemTier.T3].join(', ')}\n` +
      `  消耗品 T4: ${consumables[ItemTier.T4].join(', ')}\n` +
      `  消耗品 T5: ${consumables[ItemTier.T5].join(', ')}`,
  );

  return {
    currentTier: ItemTier.T1,
    resolvedItems,
    consumables,
  };
}

/**
 * 填充用户配置的装备
 * @param config 英雄出装配置
 * @param resolvedItems 装备记录
 * @param consumables 消耗品列表（按tier分组）
 */
function FillUserConfigItems(
  config: HeroBuildConfig,
  resolvedItems: Record<number, string[]>,
  _consumables: Record<number, string[]>,
): void {
  if (!config.targetItemsByTier) {
    return;
  }

  for (const tierStr in config.targetItemsByTier) {
    const tier = parseInt(tierStr) as ItemTier;
    const items = config.targetItemsByTier[tier];
    if (items !== undefined) {
      const regularItems: string[] = [];
      for (const itemName of items) {
        // 用户配置的装备都当作普通装备处理（消耗品通过模板的 consumablesByTier 配置）
        if (regularItems.length < 6) {
          regularItems.push(itemName);
        }
      }
      resolvedItems[tier] = regularItems;
    }
  }
}

/**
 * 为高 tier 装备补全前置装备
 * @param resolvedItems 装备记录
 * @param _consumables 消耗品列表（按tier分组，消耗品不需要补全前置装备）
 */
function FillPrerequisiteItems(resolvedItems: Record<number, string[]>): void {
  for (let tier = ItemTier.T5; tier >= ItemTier.T1; tier--) {
    const tierItems = resolvedItems[tier];

    for (const itemName of tierItems) {
      const prerequisites = GetItemPrerequisites(itemName);

      for (const prereq of prerequisites) {
        const prereqConfig = getItemConfig(prereq);
        if (!prereqConfig) continue;

        const prereqTier = prereqConfig.tier;
        // 只添加更低 tier 的前置装备，同一级别或更高级别的不添加
        if (prereqTier < tier) {
          // 添加到对应 tier，去重，且不超过 6 个
          if (!resolvedItems[prereqTier].includes(prereq)) {
            if (resolvedItems[prereqTier].length < 6) {
              resolvedItems[prereqTier].push(prereq);
            }
          }
        }
      }
    }
  }
}

/**
 * 使用 template 填充空缺或稀疏的 tier
 * @param config 英雄出装配置
 * @param resolvedItems 装备记录
 * @param consumables 消耗品列表（按tier分组）
 */
function FillTemplateItems(
  config: HeroBuildConfig,
  resolvedItems: Record<number, string[]>,
  consumables: Record<number, string[]>,
): void {
  if (config.template === undefined) {
    return;
  }

  for (let tier = ItemTier.T1; tier <= ItemTier.T5; tier++) {
    // 如果该 tier 装备数量少于 6 个，从 template 补充
    if (resolvedItems[tier].length < 6) {
      const templateItems = getTemplateItemsByTier(config.template, tier);

      for (const templateItem of templateItems) {
        // 避免重复添加
        if (!resolvedItems[tier].includes(templateItem)) {
          resolvedItems[tier].push(templateItem);
        }

        // 最多补充到 6 个装备
        if (resolvedItems[tier].length >= 6) {
          break;
        }
      }
    }

    // 从 template 中提取该 tier 的消耗品（不设上限）
    const templateConsumables = getTemplateConsumablesByTier(config.template, tier);
    for (const consumable of templateConsumables) {
      if (!consumables[tier].includes(consumable)) {
        consumables[tier].push(consumable);
      }
    }
  }
}
