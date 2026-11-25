import { NeutralItemManager } from './neutral-item';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let global: any;
global.GameRules = {
  Option: { direGoldXpMultiplier: 1 },
  GetDOTATime: jest.fn().mockReturnValue(0),
};

describe('NeutralItemManager.GetNeutralItemTier', () => {
  it('returns correct tier for a tier-1 active item', () => {
    expect(NeutralItemManager.GetNeutralItemTier('item_arcane_ring', 1)).toBe(1);
  });

  it('returns correct tier for a tier-4 active item', () => {
    expect(NeutralItemManager.GetNeutralItemTier('item_stygian_desolator', 1)).toBe(4);
  });

  it('returns correct tier for enhancement with level matching tier', () => {
    // item_enhancement_brawny tops out at level 3 (7.42 cap), so tier 3 and 4 share it and the later tier wins
    expect(NeutralItemManager.GetNeutralItemTier('item_enhancement_brawny', 1)).toBe(1);
    expect(NeutralItemManager.GetNeutralItemTier('item_enhancement_brawny', 2)).toBe(2);
    expect(NeutralItemManager.GetNeutralItemTier('item_enhancement_brawny', 3)).toBe(4);
    expect(NeutralItemManager.GetNeutralItemTier('item_enhancement_brawny', 4)).toBeUndefined();
  });

  it('keeps all tiers within 1-4', () => {
    expect(Object.keys(NeutralItemManager.GetDefaultConfig())).toEqual(['1', '2', '3', '4']);
  });

  it('returns undefined for unknown item name', () => {
    expect(NeutralItemManager.GetNeutralItemTier('item_nonexistent', 1)).toBeUndefined();
  });

  it('returns undefined when name matches but level does not', () => {
    // item_arcane_ring is tier-1 with level 1; level 2 should not match
    expect(NeutralItemManager.GetNeutralItemTier('item_arcane_ring', 2)).toBeUndefined();
  });

  it('returns undefined for item name that exists but wrong level', () => {
    // item_enhancement_brawny tier-1 has level 1; level 5 does not exist
    expect(NeutralItemManager.GetNeutralItemTier('item_enhancement_brawny', 5)).toBeUndefined();
  });
});
