/**
 * 英雄出装运行时状态
 * 状态由 BotBaseAIModifier 管理，不使用全局 Map
 */

import { HeroBuildConfig } from './hero-build-config';
import { HeroTemplate, getTemplateItemChain } from './hero-build-config-template';
import { ItemSlot, ItemTier, getItemConfig } from './item-tier-config';
import { GetItemPrerequisites } from './item-upgrade-tree';

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

  // 第一步：填充用户配置的装备（最多 6 个）
  FillUserConfigItems(config, resolvedItems, consumables);

  // 第二步：为高 tier 装备补全前置装备（每个 tier 最多 6 个）
  FillPrerequisiteItems(resolvedItems, consumables);

  // 第三步：使用 template 填充空缺或稀疏的 tier
  FillTemplateItems(config, resolvedItems, consumables);

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
 * 第一步：填充用户配置的装备
 * @param config 英雄出装配置
 * @param resolvedItems 装备记录
 * @param consumables 消耗品列表（按tier分组）
 */
function FillUserConfigItems(
  config: HeroBuildConfig,
  resolvedItems: Record<number, string[]>,
  consumables: Record<number, string[]>,
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
        const itemConfig = getItemConfig(itemName);
        if (itemConfig && itemConfig.slot === ItemSlot.Consumable) {
          // 消耗品添加到对应 tier，不设上限
          const consumableTier = itemConfig.tier;
          if (!consumables[consumableTier].includes(itemName)) {
            consumables[consumableTier].push(itemName);
          }
        } else {
          // 普通装备添加到对应 tier，最多 6 个
          if (regularItems.length < 6) {
            regularItems.push(itemName);
          }
        }
      }
      resolvedItems[tier] = regularItems;
    }
  }
}

/**
 * 第二步：为高 tier 装备补全前置装备
 * @param resolvedItems 装备记录
 * @param _consumables 消耗品列表（按tier分组，消耗品不需要补全前置装备）
 */
function FillPrerequisiteItems(
  resolvedItems: Record<number, string[]>,
  _consumables: Record<number, string[]>,
): void {
  for (let tier = ItemTier.T5; tier >= ItemTier.T1; tier--) {
    const tierItems = resolvedItems[tier];

    for (const itemName of tierItems) {
      const prerequisites = GetItemPrerequisites(itemName);

      for (const prereq of prerequisites) {
        const prereqConfig = getItemConfig(prereq);
        if (!prereqConfig) continue;

        // 消耗品不补全前置装备
        if (prereqConfig.slot === ItemSlot.Consumable) {
          continue;
        }

        const prereqTier = prereqConfig.tier;
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
 * 第三步：使用 template 填充空缺或稀疏的 tier
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
    // 如果该 tier 装备数量少于 3 个，从 template 补充
    if (resolvedItems[tier].length < 3) {
      const templateItems = GetTemplateItemsAtTier(config.template, tier, false);

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
    const templateConsumables = GetTemplateItemsAtTier(config.template, tier, true);
    for (const consumable of templateConsumables) {
      if (!consumables[tier].includes(consumable)) {
        consumables[tier].push(consumable);
      }
    }
  }
}

/**
 * 从 template 获取指定 tier 的装备列表
 * @param template 模板类型
 * @param tier 目标 tier
 * @param consumableOnly 是否只返回消耗品
 * @returns 装备列表
 */
function GetTemplateItemsAtTier(
  template: HeroTemplate,
  tier: ItemTier,
  consumableOnly: boolean,
): string[] {
  const result: string[] = [];

  // 遍历所有槽位
  for (const slot of Object.values(ItemSlot)) {
    // 如果只要消耗品，跳过非消耗品槽位
    if (consumableOnly && slot !== ItemSlot.Consumable) {
      continue;
    }
    // 如果不要消耗品，跳过消耗品槽位
    if (!consumableOnly && slot === ItemSlot.Consumable) {
      continue;
    }

    const itemChain = getTemplateItemChain(template, slot);
    if (!itemChain || itemChain.length === 0) {
      continue;
    }

    // 找到该槽位在目标 tier 的装备
    for (const itemName of itemChain) {
      const itemConfig = getItemConfig(itemName);
      if (itemConfig && itemConfig.tier === tier) {
        result.push(itemName);
        break; // 每个槽位只取一个装备
      }
    }
  }

  return result;
}
