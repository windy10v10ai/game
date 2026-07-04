import { ActionItem } from './action-item';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockItem(overrides: Partial<CDOTA_Item> = {}): any {
  return {
    GetItemSlot: jest.fn().mockReturnValue(InventorySlot.SLOT_1),
    GetCooldownTimeRemaining: jest.fn().mockReturnValue(0),
    GetAbilityChargeRestoreTime: jest.fn().mockReturnValue(0),
    GetCurrentCharges: jest.fn().mockReturnValue(1),
    GetManaCost: jest.fn().mockReturnValue(0),
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockHero(item: any): any {
  return {
    FindItemInInventory: jest.fn().mockReturnValue(item),
    GetMana: jest.fn().mockReturnValue(100),
  };
}

describe('ActionItem.FindItemInInventoryUseable', () => {
  const tomeItemNames = [
    'item_tome_of_luoshu',
    'item_tome_of_strength',
    'item_tome_of_agility',
    'item_tome_of_intelligence',
  ];

  it.each(tomeItemNames)(
    '%s in backpack slot (SLOT_8) is still returned as useable',
    (itemName) => {
      const item = createMockItem({ GetItemSlot: jest.fn().mockReturnValue(InventorySlot.SLOT_8) });
      const hero = createMockHero(item);

      expect(ActionItem.FindItemInInventoryUseable(hero, itemName)).toBe(item);
    },
  );

  it('non-tome item in backpack slot (SLOT_8) is still excluded (regression)', () => {
    const item = createMockItem({ GetItemSlot: jest.fn().mockReturnValue(InventorySlot.SLOT_8) });
    const hero = createMockHero(item);

    expect(ActionItem.FindItemInInventoryUseable(hero, 'item_black_king_bar_2')).toBeUndefined();
  });

  it('tome item in main inventory (SLOT_1) is returned as useable', () => {
    const item = createMockItem({ GetItemSlot: jest.fn().mockReturnValue(InventorySlot.SLOT_1) });
    const hero = createMockHero(item);

    expect(ActionItem.FindItemInInventoryUseable(hero, 'item_tome_of_luoshu')).toBe(item);
  });

  it('tome item in backpack slot but still on cooldown is not useable', () => {
    const item = createMockItem({
      GetItemSlot: jest.fn().mockReturnValue(InventorySlot.SLOT_8),
      GetCooldownTimeRemaining: jest.fn().mockReturnValue(5),
    });
    const hero = createMockHero(item);

    expect(ActionItem.FindItemInInventoryUseable(hero, 'item_tome_of_luoshu')).toBeUndefined();
  });
});
