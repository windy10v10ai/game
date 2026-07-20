/**
 * 测试 SellItem：tomePhase 装备保护、出售阈值计算、替代装备出售逻辑
 */

import { HeroBuildState } from './hero-build-state';
import {
  BuildItemReplaceMap,
  InitializeItemReplaceMap,
  ItemConfig,
  ItemTier,
} from './item-tier-config';
import { SellItem } from './sell-item';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;

global.print = jest.fn();
global.GetItemCost = jest.fn(() => 100);
global.UTIL_RemoveImmediate = jest.fn();

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
    ]);

    // 3 件特殊消耗品：7 + 3 = 10，封顶 9
    expect(SellItem.GetSellThreshold(itemsMap)).toBe(9);
  });
});

function fixtureItem(baseItems?: string[]): ItemConfig {
  return { name: 'item_fixture', nameCN: '测试装备', tier: ItemTier.T1, cost: 100, baseItems };
}

describe('BuildItemReplaceMap', () => {
  it('单层 baseItems：owner 替代其直接下位装备', () => {
    const config = {
      item_high: fixtureItem(['item_low']),
      item_low: fixtureItem(),
    };
    const map = BuildItemReplaceMap(config);
    expect(map.get('item_high')).toEqual(['item_low']);
    expect(map.has('item_low')).toBe(false);
  });

  it('多层 baseItems：传递闭包沿链条一路展开', () => {
    const config = {
      item_top: fixtureItem(['item_mid']),
      item_mid: fixtureItem(['item_bottom']),
      item_bottom: fixtureItem(),
    };
    const map = BuildItemReplaceMap(config);
    expect(map.get('item_top')?.sort()).toEqual(['item_bottom', 'item_mid']);
  });

  it('多材料合成（钻石型收敛）：共同的下位装备只出现一次', () => {
    const config = {
      item_final: fixtureItem(['item_branch_a', 'item_branch_b']),
      item_branch_a: fixtureItem(['item_shared']),
      item_branch_b: fixtureItem(['item_shared']),
      item_shared: fixtureItem(),
    };
    const map = BuildItemReplaceMap(config);
    expect(map.get('item_final')?.sort()).toEqual(
      ['item_branch_a', 'item_branch_b', 'item_shared'].sort(),
    );
  });

  it('没有 baseItems 的装备不出现在结果 Map 中', () => {
    const config = { item_base: fixtureItem() };
    const map = BuildItemReplaceMap(config);
    expect(map.has('item_base')).toBe(false);
  });
});

describe('SellItem.SellReplacedItems', () => {
  beforeAll(() => {
    InitializeItemReplaceMap();
  });

  it('拥有上位装备（动力鞋）时，检测到下位装备（速度之靴）需要出售', () => {
    const itemsMap = new Map<string, CDOTA_Item[]>([
      ['item_power_treads', [{ GetName: () => 'item_power_treads' }] as unknown as CDOTA_Item[]],
      ['item_boots', [{ GetName: () => 'item_boots' }] as unknown as CDOTA_Item[]],
    ]);
    const hero = { GetUnitName: () => 'npc_dota_hero_test', ModifyGold: jest.fn() };

    const result = SellItem.SellReplacedItems(hero as unknown as CDOTA_BaseNPC_Hero, itemsMap);

    expect(result).toBe(true);
  });

  it('只有下位装备、没有对应上位装备时不出售', () => {
    const itemsMap = new Map<string, CDOTA_Item[]>([
      ['item_boots', [{ GetName: () => 'item_boots' }] as unknown as CDOTA_Item[]],
    ]);
    const hero = { GetUnitName: () => 'npc_dota_hero_test', ModifyGold: jest.fn() };

    const result = SellItem.SellReplacedItems(hero as unknown as CDOTA_BaseNPC_Hero, itemsMap);

    expect(result).toBe(false);
  });
});

describe('SellItem.SellOutdatedTierItems', () => {
  it('从最低 tier 开始，卖出第一件仍在出装表中且当前拥有的过期装备', () => {
    const buildState = createBuildState({
      currentTier: ItemTier.T3,
      resolvedItems: {
        [ItemTier.T1]: ['item_falcon_blade'],
        [ItemTier.T2]: ['item_blink'],
        [ItemTier.T3]: [],
        [ItemTier.T4]: [],
        [ItemTier.T5]: [],
      },
    });
    const itemsMap = new Map<string, CDOTA_Item[]>([
      ['item_blink', [{ GetName: () => 'item_blink' }] as unknown as CDOTA_Item[]],
    ]);

    const hero = { GetUnitName: () => 'npc_dota_hero_test', ModifyGold: jest.fn() };
    const result = SellItem.SellOutdatedTierItems(
      hero as unknown as CDOTA_BaseNPC_Hero,
      itemsMap,
      buildState,
    );

    expect(result).toBe(true);
  });

  it('出装表中的装备均不在身上时不出售', () => {
    const buildState = createBuildState({
      currentTier: ItemTier.T2,
      resolvedItems: {
        [ItemTier.T1]: ['item_falcon_blade'],
        [ItemTier.T2]: [],
        [ItemTier.T3]: [],
        [ItemTier.T4]: [],
        [ItemTier.T5]: [],
      },
    });
    const itemsMap = new Map<string, CDOTA_Item[]>();
    const hero = { GetUnitName: () => 'npc_dota_hero_test', ModifyGold: jest.fn() };

    const result = SellItem.SellOutdatedTierItems(
      hero as unknown as CDOTA_BaseNPC_Hero,
      itemsMap,
      buildState,
    );

    expect(result).toBe(false);
  });
});
