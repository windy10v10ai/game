/**
 * 英雄出装运行时状态
 * 状态由 BotBaseAIModifier 管理，不使用全局 Map
 */

import { HeroBuildConfig } from './hero-build-config';
import { getTemplateConsumablesByTier, getTemplateItemsByTier } from './hero-build-config-template';
import { getItemConfig, GetItemPrerequisites, ItemTier } from './item-tier-config';
import { CandidatePoolEntry, SampleWeightedWithoutReplacement } from './weighted-pool';

/** T5 装备解锁所需的最低难度倍率 */
const T5_UNLOCK_MULTIPLIER = 9;

/** 每个 tier 装备槽位上限 */
const MAX_ITEMS_PER_TIER = 6;

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

  /** 是否已进入 tome 循环购买阶段 */
  tomePhase: boolean;

  /** 是否已购买洛书 */
  luoshuPurchased: boolean;

  /** 已购买的属性之书数量 */
  tomePurchasedCount: number;

  /** 英雄主属性（用于 tome 阶段加权） */
  heroPrimaryAttribute: Attributes;
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

  const t5Unlocked = GameRules.Option.direGoldXpMultiplier >= T5_UNLOCK_MULTIPLIER;
  const tiersToResolve = t5Unlocked
    ? [ItemTier.T1, ItemTier.T2, ItemTier.T3, ItemTier.T4, ItemTier.T5]
    : [ItemTier.T1, ItemTier.T2, ItemTier.T3, ItemTier.T4];

  // 每个 tier 二选一候选池（英雄专属优先，否则用模板），加权抽取补满槽位
  SampleTierItems(config, resolvedItems, tiersToResolve);

  // 消耗品直接复制模板全部条目，不做抽样
  FillTemplateConsumables(config, consumables, tiersToResolve);

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
    tomePhase: false,
    luoshuPurchased: false,
    tomePurchasedCount: 0,
    heroPrimaryAttribute: hero.GetPrimaryAttribute(),
  };
}

/**
 * 每个 tier 选出唯一有效候选池（英雄专属池优先于模板池），加权抽取补满槽位
 * @param config 英雄出装配置
 * @param resolvedItems 装备记录
 * @param tiers 需要解析的 tier 列表（T5 未解锁时不包含 T5）
 */
function SampleTierItems(
  config: HeroBuildConfig,
  resolvedItems: Record<number, string[]>,
  tiers: ItemTier[],
): void {
  for (const tier of tiers) {
    const heroPool = config.targetItemsByTier?.[tier];
    const pool: CandidatePoolEntry[] = heroPool ?? getTemplateItemsByTier(config.template, tier);
    resolvedItems[tier] = SampleWeightedWithoutReplacement(pool, MAX_ITEMS_PER_TIER);
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
 * 复制模板消耗品到每个待解析 tier（不做抽样，与装备候选池选取无关）
 * @param config 英雄出装配置
 * @param consumables 消耗品列表（按tier分组）
 * @param tiers 需要解析的 tier 列表（T5 未解锁时不包含 T5）
 */
function FillTemplateConsumables(
  config: HeroBuildConfig,
  consumables: Record<number, string[]>,
  tiers: ItemTier[],
): void {
  for (const tier of tiers) {
    // 复制模板中的消耗品，不能直接设置，否则使用时会被其他英雄影响
    const templateConsumables = getTemplateConsumablesByTier(config.template, tier);
    for (const consumable of templateConsumables) {
      consumables[tier].push(consumable);
    }
  }
}
