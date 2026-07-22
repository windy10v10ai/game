import {
  calculateAwakenedIlluminateDamage,
  calculateFocusDamagePctPerStack,
  calculateFocusTotalDamagePct,
  calculateIlluminateMaxChannelTime,
  calculateIlluminateRadius,
  calculateIlluminateRange,
  clampFocusStacks,
  getFocusDuration,
  isEligibleFocusHit,
  isKeeperIlluminateSpecial,
  resolveFocusStacksForOverride,
  resolveSpellAmplificationForOverride,
  shouldCastIlluminateEnd,
} from './keeper-of-the-light-awaken-math';

describe('Keeper of the Light awakening math', () => {
  it.each([
    [-3, 0],
    [0, 0],
    [2.8, 2],
    [5, 5],
    [8, 5],
  ])('clamps focus stacks %s to %s', (stacks, expected) => {
    expect(clampFocusStacks(stacks)).toBe(expected);
  });

  it.each([
    [185, 285],
    [290, 390],
    [395, 495],
    [500, 600],
    [605, 705],
  ])('adds exactly 100 damage at every Illuminate level before Focus', (baseDamage, expected) => {
    expect(calculateAwakenedIlluminateDamage(baseDamage, 0, 100, 25, 5.5, 10, 600)).toBe(expected);
  });

  it.each([
    [0, 25],
    [-0.5, 25],
    [1, 35],
    [5.5, 80],
    [6, 85],
    [9, 85],
  ])('scales each Focus stack with capped spell amplification %s', (spellAmp, expected) => {
    expect(calculateFocusDamagePctPerStack(25, spellAmp, 10, 600)).toBe(expected);
  });

  it.each([
    [0, 5, 125],
    [1, 5, 175],
    [5.5, 5, 400],
    [9, 5, 425],
    [5.5, 99, 400],
  ])(
    'calculates the total Focus damage bonus for tooltip display',
    (spellAmp, stacks, expected) => {
      expect(calculateFocusTotalDamagePct(stacks, 25, spellAmp, 10, 600)).toBe(expected);
    },
  );

  it.each([
    [185, 0, 0, 285],
    [290, 1, 0, 487.5],
    [395, 3, 1, 1014.75],
    [500, 5, 5.5, 3000],
    [605, 5, 5.5, 3525],
    [605, 5, 9, 3701.25],
  ])(
    'adds 100 base damage plus spell-amplification-scaled Focus at spell amp %s',
    (baseDamage, stacks, spellAmp, expected) => {
      expect(
        calculateAwakenedIlluminateDamage(baseDamage, stacks, 100, 25, spellAmp, 10, 600),
      ).toBeCloseTo(expected);
    },
  );

  it.each([
    [0, 3],
    [1, 2.65],
    [3, 1.95],
    [5, 1.25],
    [99, 1.25],
  ])('reduces full-charge time by 0.35 seconds per stack', (stacks, expected) => {
    expect(calculateIlluminateMaxChannelTime(3, stacks, 0.35)).toBeCloseTo(expected);
  });

  it('adds distance and radius from the same clamped snapshot', () => {
    expect(calculateIlluminateRange(1550, 4, 200)).toBe(2350);
    expect(calculateIlluminateRadius(400, 4, 60)).toBe(640);
    expect(calculateIlluminateRange(1550, 20, 200)).toBe(2550);
    expect(calculateIlluminateRadius(400, 20, 60)).toBe(700);
  });

  it.each([
    [0, 0],
    [1, 10],
    [2, 15],
    [3, 20],
    [4, 25],
    [5, 25],
  ])('maps spirit-form level %s to focus duration %s', (level, expected) => {
    expect(getFocusDuration(level, [10, 15, 20, 25])).toBe(expected);
  });

  it.each([
    [
      { isEnemy: true, isRealHero: true, isIllusion: false, isClone: false, alreadyHit: false },
      true,
    ],
    [
      { isEnemy: false, isRealHero: true, isIllusion: false, isClone: false, alreadyHit: false },
      false,
    ],
    [
      { isEnemy: true, isRealHero: false, isIllusion: false, isClone: false, alreadyHit: false },
      false,
    ],
    [
      { isEnemy: true, isRealHero: true, isIllusion: true, isClone: false, alreadyHit: false },
      false,
    ],
    [
      { isEnemy: true, isRealHero: true, isIllusion: false, isClone: true, alreadyHit: false },
      false,
    ],
    [
      { isEnemy: true, isRealHero: true, isIllusion: false, isClone: false, alreadyHit: true },
      false,
    ],
  ])('accepts only a new enemy real hero hit: %o', (candidate, expected) => {
    expect(isEligibleFocusHit(candidate)).toBe(expected);
  });

  it.each([
    ['total_damage', true],
    ['max_channel_time', true],
    ['range', true],
    ['radius', true],
    ['speed', false],
  ])('recognizes supported Illuminate special %s', (specialName, expected) => {
    expect(isKeeperIlluminateSpecial('keeper_of_the_light_illuminate', specialName)).toBe(expected);
  });

  it('rejects the same special on an unrelated ability', () => {
    expect(isKeeperIlluminateSpecial('keeper_of_the_light_chakra_magic', 'range')).toBe(false);
  });

  it('uses the live server spell amplification on the server', () => {
    expect(
      resolveSpellAmplificationForOverride({
        isServer: true,
        serverSpellAmplification: 5.5,
        replicatedSpellAmplification: 1.25,
      }),
    ).toBe(5.5);
  });

  it('uses replicated spell amplification when the client cannot call the server-only API', () => {
    expect(
      resolveSpellAmplificationForOverride({
        isServer: false,
        replicatedSpellAmplification: 5.5,
      }),
    ).toBe(5.5);
  });

  it.each([
    [-1, 0],
    [Number.NaN, 0],
  ])('sanitizes replicated spell amplification %s to %s', (replicatedSpellAmp, expected) => {
    expect(
      resolveSpellAmplificationForOverride({
        isServer: false,
        replicatedSpellAmplification: replicatedSpellAmp,
      }),
    ).toBe(expected);
  });

  it.each([
    [true, true, 4, 2, 2],
    [true, false, 4, 2, 4],
    [false, true, 4, 2, 4],
    [false, false, 7, 2, 5],
  ])(
    'uses the server cast snapshot only while active, otherwise the replicated controller stacks',
    (isServer, snapshotActive, replicatedStacks, snapshotStacks, expected) => {
      expect(
        resolveFocusStacksForOverride({
          isServer,
          snapshotActive,
          replicatedStacks,
          snapshotStacks,
        }),
      ).toBe(expected);
    },
  );

  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false],
  ])(
    'casts Illuminate End only when the sub-ability exists and is activated',
    (hasEndAbility, isActivated, expected) => {
      expect(shouldCastIlluminateEnd(hasEndAbility, isActivated)).toBe(expected);
    },
  );
});
