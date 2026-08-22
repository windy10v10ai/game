import {
  calculateCurrentFingerDamage,
  calculateFingerMeleeBonusDamage,
  calculateMissingHealthBonusDamage,
  calculateObservedGrowthDelta,
  initializeObservedGrowthStacks,
  reduceRemainingCooldown,
  settlePendingGrowthCooldown,
} from './lion-finger-of-death-awaken-math';

describe('Lion Finger of Death awaken math', () => {
  test('includes permanent Finger growth in the current Finger damage', () => {
    expect(calculateCurrentFingerDamage(1400, 12, 50)).toBe(2000);
  });

  test('converts the current Finger damage into melee-form bonus damage', () => {
    expect(calculateFingerMeleeBonusDamage(1400, 50)).toBe(700);
    expect(calculateFingerMeleeBonusDamage(1400, 0)).toBe(0);
  });

  test('deals a percentage of health missing in the pre-hit snapshot', () => {
    expect(calculateMissingHealthBonusDamage(300, 1000, 25)).toBe(175);
  });

  test('is independent of lethal or overflowing trigger damage because it only uses the snapshot', () => {
    expect(calculateMissingHealthBonusDamage(300, 1000, 25)).toBe(175);
    expect(calculateMissingHealthBonusDamage(0, 1000, 25)).toBe(250);
  });

  test('establishes a baseline without settling historical growth and only returns positive deltas', () => {
    expect(calculateObservedGrowthDelta(undefined, 12)).toEqual({ nextStackCount: 12, delta: 0 });
    expect(calculateObservedGrowthDelta(12, 15)).toEqual({ nextStackCount: 15, delta: 3 });
    expect(calculateObservedGrowthDelta(15, 2)).toEqual({ nextStackCount: 2, delta: 0 });
  });

  test('starts at zero before the counter exists so the first growth is settled', () => {
    const initialStacks = initializeObservedGrowthStacks(undefined);
    expect(calculateObservedGrowthDelta(initialStacks, 1)).toEqual({
      nextStackCount: 1,
      delta: 1,
    });
  });

  test('uses existing historical growth as the initialization baseline', () => {
    const initialStacks = initializeObservedGrowthStacks(12);
    expect(calculateObservedGrowthDelta(initialStacks, 12)).toEqual({
      nextStackCount: 12,
      delta: 0,
    });
  });

  test('reduces remaining cooldown per growth without going below zero', () => {
    expect(reduceRemainingCooldown(38, 2, 10)).toBe(18);
    expect(reduceRemainingCooldown(7, 1, 10)).toBe(0);
  });

  test('keeps pending growth while Finger is temporarily unavailable', () => {
    expect(settlePendingGrowthCooldown(2, undefined, 10)).toEqual({
      pendingGrowthDelta: 2,
      nextRemainingCooldown: undefined,
    });
  });

  test('consumes pending growth when Finger exists without a current cooldown', () => {
    expect(settlePendingGrowthCooldown(2, 0, 10)).toEqual({
      pendingGrowthDelta: 0,
      nextRemainingCooldown: 0,
    });
  });

  test('applies and consumes pending growth when Finger is cooling down', () => {
    expect(settlePendingGrowthCooldown(2, 38, 10)).toEqual({
      pendingGrowthDelta: 0,
      nextRemainingCooldown: 18,
    });
  });
});
