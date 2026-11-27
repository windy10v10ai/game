import { ItemLotteryHelper, ItemLotteryPool } from './item-lottery-helper';
import { itemTiers, treasuredItems } from './lottery-items';

const TREASURED_ITEMS = [
  'item_bfury_copy',
  'item_radiance_copy',
  'item_blade_mail_copy',
  'item_heart_copy',
  'item_aghanim_bundle',
  'item_haste_moon_bundle',
  'item_berserkers_sabatons_copy',
  'item_echo_sabre_2_copy',
  'item_hydras_breath_copy',
  'item_hand_of_midas_copy',
  'item_starforge_copy',
  'item_dagon_ultra_copy',
];

const ORIGINAL_ITEMS = ['item_bfury', 'item_radiance', 'item_blade_mail', 'item_heart'];
const BUNDLE_CONTENTS = [
  'item_ultimate_scepter',
  'item_ultimate_scepter_copy',
  'item_aghanims_shard',
];

function namesOf(level: number): string[] {
  return itemTiers.find((tier) => tier.level === level)?.names ?? [];
}

describe('itemTiers', () => {
  it('includes the complete treasured series in T1', () => {
    const tier1 = namesOf(1);
    for (const name of TREASURED_ITEMS) {
      expect(tier1).toContain(name);
    }
  });

  it('excludes the original versions from the whole reward pool', () => {
    const names = itemTiers.flatMap((tier) => tier.names);
    for (const name of ORIGINAL_ITEMS) {
      expect(names).not.toContain(name);
    }
  });

  it('only offers bundle contents through their bundles', () => {
    const names = [...treasuredItems, ...itemTiers.flatMap((tier) => tier.names)];
    for (const name of BUNDLE_CONTENTS) {
      expect(names).not.toContain(name);
    }
  });

  it('draws the full treasured catalogue without repeating or filling with other items', () => {
    const originalRandomInt = globalThis.RandomInt;
    globalThis.RandomInt = (min) => min;
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    try {
      expect(new Set(treasuredItems)).toEqual(new Set(TREASURED_ITEMS));
      const candidates = ItemLotteryHelper.getRandomItems(20, ItemLotteryPool.TREASURED);
      expect(candidates).toHaveLength(TREASURED_ITEMS.length);
      expect(candidates.map(({ name, level }) => [name, level])).toEqual(
        TREASURED_ITEMS.map((name) => [name, 1]),
      );
    } finally {
      random.mockRestore();
      globalThis.RandomInt = originalRandomInt;
    }
  });

  it('所有 tier 的名字不重复', () => {
    const all = itemTiers.reduce<string[]>((acc, tier) => acc.concat(tier.names), []);
    expect(new Set(all).size).toBe(all.length);
  });
});
