/**
 * 英雄出装运行时状态
 * 状态由 BotBaseAIModifier 管理，不使用全局 Map
 */

import { ItemTier, ItemSlot, getItemConfig } from './item-tier-config';
import { GetItemPrerequisites } from './item-upgrade-tree';
import { HeroBuildConfig } from './hero-build-config';
import { HeroTemplate, getTemplateItemChain } from './hero-template-config';

/**
 * 英雄出装运行时状态
 */
export interface HeroBuildState {
  /** 当前应该购买的 tier */
  currentTier: ItemTier;

  /** 每个 tier 的装备列表（初始化时补全） */
  resolvedItems: {
    [tier: number]: string[]; // 装备名数组
  };

  /** 已消耗的装备记录 */
  consumedItems: Set<string>;
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

  // 第一步：填充用户配置的装备
  if (config.targetItemsByTier) {
    for (const tierStr in config.targetItemsByTier) {
      const tier = parseInt(tierStr) as ItemTier;
      const items = config.targetItemsByTier[tier];
      if (items !== undefined) {
        resolvedItems[tier] = [...items];
      }
    }
  }

  // 第二步：为高 tier 装备补全前置装备
  for (let tier = ItemTier.T5; tier >= ItemTier.T1; tier--) {
    const tierItems = resolvedItems[tier];

    for (const itemName of tierItems) {
      const prerequisites = GetItemPrerequisites(itemName);

      for (const prereq of prerequisites) {
        const prereqConfig = getItemConfig(prereq);
        if (!prereqConfig) continue;

        const prereqTier = prereqConfig.tier;
        if (prereqTier < tier) {
          // 添加到对应 tier，去重
          if (!resolvedItems[prereqTier].includes(prereq)) {
            resolvedItems[prereqTier].push(prereq);
          }
        }
      }
    }
  }

  // 第三步：使用 template 填充空缺或稀疏的 tier
  if (config.template !== undefined) {
    for (let tier = ItemTier.T1; tier <= ItemTier.T5; tier++) {
      // 如果该 tier 装备数量少于 3 个，从 template 补充
      if (resolvedItems[tier].length < 3) {
        const templateItems = GetTemplateItemsAtTier(config.template, tier);

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
    }
  }

  print(
    `[AI] InitializeHeroBuild ${hero.GetUnitName()} 初始化出装:\n` +
      `  T1: ${resolvedItems[ItemTier.T1].join(', ')}\n` +
      `  T2: ${resolvedItems[ItemTier.T2].join(', ')}\n` +
      `  T3: ${resolvedItems[ItemTier.T3].join(', ')}\n` +
      `  T4: ${resolvedItems[ItemTier.T4].join(', ')}\n` +
      `  T5: ${resolvedItems[ItemTier.T5].join(', ')}`,
  );

  return {
    currentTier: ItemTier.T1,
    resolvedItems,
    consumedItems: new Set(),
  };
}

/**
 * 从 template 获取指定 tier 的装备列表
 * @param template 模板类型
 * @param tier 目标 tier
 * @returns 装备列表
 */
function GetTemplateItemsAtTier(template: HeroTemplate, tier: ItemTier): string[] {
  const result: string[] = [];

  // 遍历所有槽位
  for (const slot of Object.values(ItemSlot)) {
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

/**
 * 标记装备为已消耗
 * @param state 出装状态
 * @param itemName 装备名称
 */
export function MarkItemAsConsumed(state: HeroBuildState, itemName: string): void {
  state.consumedItems.add(itemName);
}
