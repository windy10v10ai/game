/* eslint-disable @typescript-eslint/no-explicit-any */
declare let global: any;

global.print = jest.fn();

// 固定种子的伪随机，Math.random 与 RandomInt 共用，每个用例的结果可复现
let seed = 0;
function nextRandom(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const seededRandomInt = (min: number, max: number) =>
  min + Math.floor(nextRandom() * (max - min + 1));
global.RandomInt = seededRandomInt;

import { AbilityLotteryHelper } from './ability-lottery-helper';

describe('AbilityLotteryHelper mutually exclusive abilities', () => {
  beforeEach(() => {
    seed = 12345;
    global.RandomInt = seededRandomInt;
    jest.spyOn(Math, 'random').mockImplementation(nextRandom);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const tiers = Array.from({ length: 5 }, (_, i) => ({
    level: 5 - i,
    names: [
      'luna_moon_glaive',
      'jakiro_double_trouble2',
      // 抽取最多重试 10 次，池子要远大于排除名单
      ...Array.from({ length: 60 }, (_, n) => `filler_${n}`),
    ],
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

  it('retries when the random pick lands on an excluded name', () => {
    // 62 个名字：下标 0 是月刃，1 是天生一对，0.5 落在 filler_29
    global.RandomInt = () => 1;
    const sequence = [0, 1.5 / 62, 0.5];
    jest.spyOn(Math, 'random').mockImplementation(() => sequence.shift() ?? 0.5);
    const results = AbilityLotteryHelper.getRandomAbilities(tiers, 1, undefined, [
      'luna_moon_glaive',
    ]);
    expect(results).toEqual([{ name: 'filler_29', level: 5 }]);
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

    it('swaps in a same-tier ability for any random value', () => {
      const conflictHero = makeHero(['jakiro_double_trouble2']);
      for (const r of [0, 0.5, 0.999999]) {
        jest.spyOn(Math, 'random').mockReturnValue(r);
        const result = AbilityLotteryHelper.resolveConflictingPick(
          conflictHero,
          { name: 'luna_moon_glaive', level: 4 },
          tiers,
        );
        expect(['luna_moon_glaive', 'jakiro_double_trouble2']).not.toContain(result.name);
        expect(result.level).toBe(4);
        expect(tiers.find((t) => t.level === 4)?.names).toContain(result.name);
      }
    });

    it('falls back to other tiers when the tier has nothing left', () => {
      const smallTiers = [
        { level: 4, names: ['luna_moon_glaive', 'jakiro_double_trouble2'] },
        { level: 3, names: ['other'] },
      ];
      const result = AbilityLotteryHelper.resolveConflictingPick(
        makeHero(['jakiro_double_trouble2']),
        { name: 'luna_moon_glaive', level: 4 },
        smallTiers,
      );
      expect(result).toEqual({ name: 'other', level: 3 });
    });

    it('keeps the pick when no replacement exists at all', () => {
      const picked = { name: 'luna_moon_glaive', level: 4 };
      const result = AbilityLotteryHelper.resolveConflictingPick(
        makeHero(['jakiro_double_trouble2']),
        picked,
        [{ level: 4, names: ['luna_moon_glaive', 'jakiro_double_trouble2'] }],
      );
      expect(result).toBe(picked);
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
