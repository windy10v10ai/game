import { itemTiers } from './lottery-items';

const TREASURED_ITEMS = [
  'item_bfury_copy',
  'item_radiance_copy',
  'item_blade_mail_copy',
  'item_heart_copy',
  'item_aghanim_bundle',
  'item_haste_moon_bundle',
];

const ORIGINAL_ITEMS = ['item_bfury', 'item_radiance', 'item_blade_mail', 'item_heart'];

const BUNDLE_CONTENTS = [
  'item_ultimate_scepter',
  'item_ultimate_scepter_copy',
  'item_aghanims_shard',
  'item_wings_of_haste_copy',
  'item_moon_shard_copy',
];

function namesOf(level: number): string[] {
  return itemTiers.find((tier) => tier.level === level)?.names ?? [];
}

describe('itemTiers', () => {
  it('T1 包含 4 件珍藏版装备', () => {
    const tier1 = namesOf(1);
    for (const name of TREASURED_ITEMS) {
      expect(tier1).toContain(name);
    }
  });

  it('珍藏版与原版分在不同 tier', () => {
    const tier1 = namesOf(1);
    for (const name of ORIGINAL_ITEMS) {
      expect(tier1).not.toContain(name);
    }
  });

  it('only offers bundle contents through their bundles', () => {
    const names = itemTiers.flatMap((tier) => tier.names);
    for (const name of BUNDLE_CONTENTS) {
      expect(names).not.toContain(name);
    }
  });

  it('所有 tier 的名字不重复', () => {
    const all = itemTiers.reduce<string[]>((acc, tier) => acc.concat(tier.names), []);
    expect(new Set(all).size).toBe(all.length);
  });
});
