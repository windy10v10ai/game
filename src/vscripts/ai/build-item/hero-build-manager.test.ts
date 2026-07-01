/**
 * 测试 HeroBuildManager 的购买流程接入 tome 阶段
 */

import { HeroBuildManager } from './hero-build-manager';
import { HeroBuildState } from './hero-build-state';
import { ItemTier } from './item-tier-config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

global.print = jest.fn();
global.GameRules = {
  Option: { direGoldXpMultiplier: 1 },
};
global.GetItemCost = jest.fn(() => 100);
global.RandomFloat = (min: number, max: number) => min + Math.random() * (max - min);

function createMockHero(ownedItems: string[] = []) {
  return {
    GetUnitName: () => 'npc_dota_hero_test',
    GetGold: () => 999999,
    GetItemInSlot: (slot: number) => {
      const itemName = ownedItems[slot];
      return itemName ? { IsNull: () => false, GetName: () => itemName } : undefined;
    },
    AddItemByName: (itemName: string) => ({ GetName: () => itemName }),
    SpendGold: jest.fn(),
  } as unknown as CDOTA_BaseNPC_Hero;
}

function createBuildState(overrides: Partial<HeroBuildState> = {}): HeroBuildState {
  return {
    currentTier: ItemTier.T5,
    resolvedItems: {
      [ItemTier.T1]: [],
      [ItemTier.T2]: [],
      [ItemTier.T3]: [],
      [ItemTier.T4]: [],
      [ItemTier.T5]: [],
    },
    consumables: {
      [ItemTier.T1]: [],
      [ItemTier.T2]: [],
      [ItemTier.T3]: [],
      [ItemTier.T4]: [],
      [ItemTier.T5]: [],
    },
    tomePhase: false,
    luoshuPurchased: false,
    tomePurchasedCount: 0,
    heroPrimaryAttribute: Attributes.STRENGTH,
    ...overrides,
  };
}

describe('HeroBuildManager.TryPurchaseItem - tome 阶段', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.GameRules = {
      Option: { direGoldXpMultiplier: 1 },
    };
  });

  it('currentTier 不是 T5 时，不触发 tome 分支', () => {
    const hero = createMockHero();
    const buildState = createBuildState({
      currentTier: ItemTier.T3,
      resolvedItems: {
        [ItemTier.T1]: [],
        [ItemTier.T2]: [],
        [ItemTier.T3]: [],
        [ItemTier.T4]: [],
        [ItemTier.T5]: [],
      },
    });

    HeroBuildManager.TryPurchaseItem(hero, buildState);

    expect(buildState.tomePhase).toBe(false);
  });

  it('currentTier === T5 但 resolvedItems[T5] 里还有背包没有的装备时，不进入 tome 阶段', () => {
    const hero = createMockHero();
    const buildState = createBuildState({
      currentTier: ItemTier.T5,
      resolvedItems: {
        [ItemTier.T1]: [],
        [ItemTier.T2]: [],
        [ItemTier.T3]: [],
        [ItemTier.T4]: [],
        [ItemTier.T5]: ['item_time_gem'],
      },
    });

    // 购买 T5 装备时 tomePhase 仍应保持 false（尚未买完）
    HeroBuildManager.TryPurchaseItem(hero, buildState);

    expect(buildState.tomePhase).toBe(false);
  });

  it('T5 常规装备全部买完、luoshuPurchased 为 false 时，下一次 TryPurchaseItem 购买洛书', () => {
    const hero = createMockHero(['item_time_gem']);
    const buildState = createBuildState({
      currentTier: ItemTier.T5,
      resolvedItems: {
        [ItemTier.T1]: [],
        [ItemTier.T2]: [],
        [ItemTier.T3]: [],
        [ItemTier.T4]: [],
        [ItemTier.T5]: ['item_time_gem'],
      },
      luoshuPurchased: false,
      tomePurchasedCount: 0,
    });

    const result = HeroBuildManager.TryPurchaseItem(hero, buildState);

    expect(result).toBe(true);
    expect(buildState.tomePhase).toBe(true);
    expect(buildState.luoshuPurchased).toBe(true);
    expect(buildState.tomePurchasedCount).toBe(0);
  });

  it('luoshuPurchased 为 true 且 tomePurchasedCount 小于难度上限时，购买属性书', () => {
    global.GameRules.Option.direGoldXpMultiplier = 6; // GetTomePurchaseCap(6) === 20
    const hero = createMockHero();
    const buildState = createBuildState({
      currentTier: ItemTier.T5,
      tomePhase: true,
      luoshuPurchased: true,
      tomePurchasedCount: 5,
    });

    const result = HeroBuildManager.TryPurchaseItem(hero, buildState);

    expect(result).toBe(true);
    expect(buildState.tomePurchasedCount).toBe(6);
    expect(buildState.luoshuPurchased).toBe(true);
  });

  it('tomePurchasedCount 已达到难度上限时，不再购买属性书', () => {
    global.GameRules.Option.direGoldXpMultiplier = 6; // GetTomePurchaseCap(6) === 20
    const hero = createMockHero();
    const buildState = createBuildState({
      currentTier: ItemTier.T5,
      tomePhase: true,
      luoshuPurchased: true,
      tomePurchasedCount: 20,
    });

    const result = HeroBuildManager.TryPurchaseItem(hero, buildState);

    expect(result).toBe(false);
    expect(buildState.tomePurchasedCount).toBe(20);
  });

  it('难度过低导致 T5 未解锁（resolvedItems[T5] 为空数组）时，T4 买完后立即进入 tome 阶段并购买洛书', () => {
    global.GameRules.Option.direGoldXpMultiplier = 5; // T5 未解锁
    const hero = createMockHero();
    const buildState = createBuildState({
      currentTier: ItemTier.T5, // 已由调用方在 T4 买完后推进到 T5（vacuous check）
      resolvedItems: {
        [ItemTier.T1]: [],
        [ItemTier.T2]: [],
        [ItemTier.T3]: [],
        [ItemTier.T4]: [],
        [ItemTier.T5]: [], // T5 未解锁，从未被填充候选装备
      },
      luoshuPurchased: false,
      tomePurchasedCount: 0,
    });

    const result = HeroBuildManager.TryPurchaseItem(hero, buildState);

    expect(result).toBe(true);
    expect(buildState.tomePhase).toBe(true);
    expect(buildState.luoshuPurchased).toBe(true);
  });
});
