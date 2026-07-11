/**
 * 英雄出装运行时状态
 * 状态由 BotBaseAIModifier 管理，不使用全局 Map
 */

import { HeroBuildConfig } from './hero-build-config';
import {
  getTemplateConsumablesByTier,
  getTemplateItemsByTier,
  GetTomePurchaseCap,
} from './hero-build-config-template';
import { getItemConfig, ItemTier } from './item-tier-config';
import { CandidatePoolEntry, SampleWeightedWithoutReplacement } from './weighted-pool';

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

  /** tome 购买上限，初始化时按当前难度倍率冻结，避免游戏内难度变化影响已在进行的出装 */
  tomePurchaseCap: number;

  /** 英雄主属性（用于 tome 阶段加权） */
  heroPrimaryAttribute: Attributes;

  /** tome 循环购买索引（固定顺序，非随机） */
  tomeCycleIndex: number;
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

  const multiplier = GameRules.Option.direGoldXpMultiplier;
  const tiersToResolve = [ItemTier.T1, ItemTier.T2, ItemTier.T3, ItemTier.T4, ItemTier.T5];

  // 每个 tier 二选一候选池（英雄专属优先，否则用模板），加权抽取补满槽位
  SampleTierItems(config, resolvedItems, tiersToResolve, multiplier);

  // 消耗品直接复制模板全部条目，不做抽样
  FillTemplateConsumables(config, consumables, tiersToResolve);

  const toNames = (names: string[]) =>
    names.map((name) => getItemConfig(name)?.nameCN ?? name).join(', ');

  print(
    `[AI] InitializeHeroBuild ${hero.GetUnitName()} 初始化出装:\n` +
      `  T1: ${toNames(resolvedItems[ItemTier.T1])}\n` +
      `  T2: ${toNames(resolvedItems[ItemTier.T2])}\n` +
      `  T3: ${toNames(resolvedItems[ItemTier.T3])}\n` +
      `  T4: ${toNames(resolvedItems[ItemTier.T4])}\n` +
      `  T5: ${toNames(resolvedItems[ItemTier.T5])}\n` +
      `  消耗品 T1: ${toNames(consumables[ItemTier.T1])}\n` +
      `  消耗品 T2: ${toNames(consumables[ItemTier.T2])}\n` +
      `  消耗品 T3: ${toNames(consumables[ItemTier.T3])}\n` +
      `  消耗品 T4: ${toNames(consumables[ItemTier.T4])}\n` +
      `  消耗品 T5: ${toNames(consumables[ItemTier.T5])}`,
  );

  return {
    currentTier: ItemTier.T1,
    resolvedItems,
    consumables,
    tomePhase: false,
    luoshuPurchased: false,
    tomePurchasedCount: 0,
    tomePurchaseCap: GetTomePurchaseCap(multiplier),
    heroPrimaryAttribute: hero.GetPrimaryAttribute(),
    tomeCycleIndex: 0,
  };
}

/**
 * 按难度倍率返回 T5 装备槽位数（难度阶梯，替代原先的硬解锁阈值）
 */
export function GetT5ItemCount(multiplier: number): number {
  if (multiplier < 3) {
    return 0;
  } else if (multiplier < 5) {
    return 1;
  } else if (multiplier < 7) {
    return 2;
  } else if (multiplier < 10) {
    return 3;
  } else if (multiplier < 15) {
    return 4;
  } else if (multiplier < 20) {
    return 5;
  } else {
    return 6;
  }
}

/**
 * 每个 tier 选出唯一有效候选池（英雄专属池优先于模板池），加权抽取补满槽位
 * @param config 英雄出装配置
 * @param resolvedItems 装备记录
 * @param tiers 需要解析的 tier 列表
 * @param multiplier 难度倍率，决定 T5 槽位数
 */
function SampleTierItems(
  config: HeroBuildConfig,
  resolvedItems: Record<number, string[]>,
  tiers: ItemTier[],
  multiplier: number,
): void {
  for (const tier of tiers) {
    const heroPool = config.targetItemsByTier?.[tier];
    const pool: CandidatePoolEntry[] = heroPool ?? getTemplateItemsByTier(config.template, tier);
    const slotCount = tier === ItemTier.T5 ? GetT5ItemCount(multiplier) : MAX_ITEMS_PER_TIER;
    resolvedItems[tier] = SampleWeightedWithoutReplacement(pool, slotCount);
  }
}

/**
 * 复制模板消耗品到每个待解析 tier（不做抽样，与装备候选池选取无关）
 * @param config 英雄出装配置
 * @param consumables 消耗品列表（按tier分组）
 * @param tiers 需要解析的 tier 列表
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
