/* eslint-disable @typescript-eslint/no-explicit-any */
declare let global: any;

global.RandomInt = jest.fn((min: number, _max: number) => min);

import { AbilityLotteryHelper } from './ability-lottery-helper';

describe('AbilityLotteryHelper mutually exclusive abilities', () => {
  const tiers = Array.from({ length: 5 }, (_, i) => ({
    level: 5 - i,
    names: ['luna_moon_glaive', 'jakiro_double_trouble2', 'a', 'b', 'c', 'd', 'e', 'f'],
  }));

  it('adds the whole group once one member is present', () => {
    const names = ['luna_moon_glaive'];
    AbilityLotteryHelper.addMutuallyExclusiveNames(names);
    expect(names).toEqual(
      expect.arrayContaining([
        'luna_moon_glaive',
        'jakiro_double_trouble',
        'jakiro_double_trouble2',
      ]),
    );
  });

  it('never offers the partner of an owned ability', () => {
    for (let n = 0; n < 50; n++) {
      const results = AbilityLotteryHelper.getRandomAbilities(tiers, 3, undefined, [
        'luna_moon_glaive',
      ]);
      expect(results.map((r) => r.name)).not.toContain('jakiro_double_trouble2');
    }
  });

  it('never offers the partner of an ability the hero already has', () => {
    const hero = {
      GetAbilityCount: () => 1,
      GetAbilityByIndex: () => ({ GetAbilityName: () => 'jakiro_double_trouble' }),
    } as unknown as CDOTA_BaseNPC_Hero;
    for (let n = 0; n < 50; n++) {
      const results = AbilityLotteryHelper.getRandomAbilities(tiers, 3, hero, []);
      expect(results.map((r) => r.name)).not.toContain('luna_moon_glaive');
      expect(results.map((r) => r.name)).not.toContain('jakiro_double_trouble2');
    }
  });

  describe('resolveConflictingPick', () => {
    const makeHero = (owned: string[]) =>
      ({
        GetAbilityCount: () => owned.length,
        GetAbilityByIndex: (i: number) => ({ GetAbilityName: () => owned[i] }),
      }) as unknown as CDOTA_BaseNPC_Hero;

    it('keeps the pick when the hero has no partner', () => {
      const picked = { name: 'luna_moon_glaive', level: 4 };
      expect(AbilityLotteryHelper.resolveConflictingPick(makeHero(['a']), picked, tiers)).toBe(
        picked,
      );
    });

    it('swaps in a same-tier ability when the hero already has the partner', () => {
      for (let n = 0; n < 50; n++) {
        const result = AbilityLotteryHelper.resolveConflictingPick(
          makeHero(['jakiro_double_trouble2']),
          { name: 'luna_moon_glaive', level: 4 },
          tiers,
        );
        expect(['luna_moon_glaive', 'jakiro_double_trouble2']).not.toContain(result.name);
        expect(result.level).toBe(4);
      }
    });
  });

  it('never offers both members within one draw', () => {
    for (let n = 0; n < 50; n++) {
      const names = AbilityLotteryHelper.getRandomAbilities(tiers, 3, undefined, []).map(
        (r) => r.name,
      );
      expect(names.includes('luna_moon_glaive') && names.includes('jakiro_double_trouble2')).toBe(
        false,
      );
    }
  });
});
