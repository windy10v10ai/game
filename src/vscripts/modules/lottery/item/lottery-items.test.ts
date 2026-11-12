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

  it('所有 tier 的名字不重复', () => {
    const all = itemTiers.reduce<string[]>((acc, tier) => acc.concat(tier.names), []);
    expect(new Set(all).size).toBe(all.length);
  });
});
