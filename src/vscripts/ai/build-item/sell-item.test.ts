/**
 * 测试 SellItem：tomePhase 装备保护、出售阈值计算
 */

import { HeroBuildState } from './hero-build-state';
import { ItemTier } from './item-tier-config';
import { SellItem } from './sell-item';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

global.print = jest.fn();
global.GetItemCost = jest.fn(() => 100);

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
    tomePurchaseCap: 6,
    heroPrimaryAttribute: Attributes.STRENGTH,
    tomeCycleIndex: 0,
    ...overrides,
  };
}

describe('SellItem.RemoveCurrentTierItems', () => {
  it('tomePhase 为 false 时，只保护 currentTier 的装备', () => {
    const buildState = createBuildState({
      currentTier: ItemTier.T4,
      resolvedItems: {
        [ItemTier.T1]: ['item_boots'],
        [ItemTier.T2]: ['item_blink'],
        [ItemTier.T3]: ['item_heart'],
        [ItemTier.T4]: ['item_black_king_bar_2'],
        [ItemTier.T5]: [],
      },
    });
    const itemsMap = new Map<string, CDOTA_Item[]>([
      ['item_boots', []],
      ['item_blink', []],
      ['item_heart', []],
      ['item_black_king_bar_2', []],
    ]);

    SellItem.RemoveCurrentTierItems(itemsMap, buildState);

    expect(itemsMap.has('item_boots')).toBe(true);
    expect(itemsMap.has('item_blink')).toBe(true);
    expect(itemsMap.has('item_heart')).toBe(true);
    expect(itemsMap.has('item_black_king_bar_2')).toBe(false);
  });

  it('tomePhase 为 true（T5 因难度不足被跳过）时，T1~T4 已购买的装备全部受保护，不再被当作过期装备卖掉', () => {
    const buildState = createBuildState({
      currentTier: ItemTier.T5,
      tomePhase: true,
      resolvedItems: {
        [ItemTier.T1]: ['item_boots'],
        [ItemTier.T2]: ['item_blink'],
        [ItemTier.T3]: ['item_heart'],
        [ItemTier.T4]: ['item_black_king_bar_2'],
        [ItemTier.T5]: [],
      },
    });
    const itemsMap = new Map<string, CDOTA_Item[]>([
      ['item_boots', []],
      ['item_blink', []],
      ['item_heart', []],
      ['item_black_king_bar_2', []],
    ]);

    SellItem.RemoveCurrentTierItems(itemsMap, buildState);

    expect(itemsMap.size).toBe(0);
  });
});

describe('SellItem.GetSellThreshold', () => {
  it('没有特殊消耗品时，阈值为 7', () => {
    const itemsMap = new Map<string, CDOTA_Item[]>([
      [
        'item_black_king_bar_2',
        [{ GetName: () => 'item_black_king_bar_2' }] as unknown as CDOTA_Item[],
      ],
      [
        'item_shivas_guard_2',
        [{ GetName: () => 'item_shivas_guard_2' }] as unknown as CDOTA_Item[],
      ],
    ]);

    expect(SellItem.GetSellThreshold(itemsMap)).toBe(7);
  });

  it('持有特殊消耗品时，阈值按数量提升，封顶 9', () => {
    const dummyItem = [{ GetName: () => 'item_tome_of_luoshu' }] as unknown as CDOTA_Item[];
    const itemsMap = new Map<string, CDOTA_Item[]>([
      ['item_tome_of_luoshu', dummyItem],
      ['item_ward_observer', [{ GetName: () => 'item_ward_observer' }] as unknown as CDOTA_Item[]],
      [
        'item_smoke_of_deceit',
        [{ GetName: () => 'item_smoke_of_deceit' }] as unknown as CDOTA_Item[],
      ],
      [
        'item_roshans_banner',
        [{ GetName: () => 'item_roshans_banner' }] as unknown as CDOTA_Item[],
      ],
    ]);

    // 4 件特殊消耗品：7 + 4 = 11，封顶 9
    expect(SellItem.GetSellThreshold(itemsMap)).toBe(9);
  });
});
