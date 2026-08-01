import {
  FieldTouchTracker,
  calculateBonusArmorReductionDelta,
  calculateDefenseReduction,
  calculateFieldBonuses,
  calculateMagicResistanceTarget,
  calculateRadiusWithCastRangeBonus,
  isEligibleFieldTarget,
  isEligibleRealHeroTarget,
  resolveAwakenCastMode,
  resolveAwakenFieldState,
  resolveFieldBuffSync,
  resolveFieldMode,
  resolveNaturalOrderOverlap,
  shouldOverrideNaturalOrderRadius,
  shouldRestoreAwakenWrapper,
  shouldTrackPendingSpiritReturn,
} from './elder-titan-awaken-math';

describe('FieldTouchTracker', () => {
  it('accepts each entity once per field and resets for a new field', () => {
    const tracker = new FieldTouchTracker();

    expect(tracker.touch(101)).toBe(true);
    expect(tracker.touch(101)).toBe(false);
    expect(tracker.touch(202)).toBe(true);

    tracker.reset();
    expect(tracker.touch(101)).toBe(true);
  });
});

describe('resolveFieldMode', () => {
  it('uses the replicated controller state on clients instead of server-only autocast APIs', () => {
    expect(resolveFieldMode(true, true, 0)).toBe(true);
    expect(resolveFieldMode(true, false, 1)).toBe(false);
    expect(resolveFieldMode(false, undefined, 1)).toBe(true);
    expect(resolveFieldMode(false, undefined, 0)).toBe(false);
  });
});
describe('resolveFieldBuffSync', () => {
  it('forces one delayed sync after creation-time targets were already touched', () => {
    expect(resolveFieldBuffSync(true, false)).toEqual({
      shouldSync: true,
      initialSyncPending: false,
    });
  });

  it('does not resend when the initial sync is complete and no target is new', () => {
    expect(resolveFieldBuffSync(false, false)).toEqual({
      shouldSync: false,
      initialSyncPending: false,
    });
  });

  it('resends when a new target enters after the initial sync', () => {
    expect(resolveFieldBuffSync(false, true)).toEqual({
      shouldSync: true,
      initialSyncPending: false,
    });
  });
});

describe('resolveAwakenCastMode', () => {
  it('uses point targeting normally and immediate no-target casting in field mode', () => {
    expect(resolveAwakenCastMode(false)).toBe('point');
    expect(resolveAwakenCastMode(true)).toBe('no-target');
  });
});
describe('resolveNaturalOrderOverlap', () => {
  it('leaves native Natural Order active and only fills missing base reductions', () => {
    expect(resolveNaturalOrderOverlap(false, false)).toEqual({
      applyBaseArmorReduction: true,
      applyBaseMagicResistanceReduction: true,
    });
    expect(resolveNaturalOrderOverlap(true, false)).toEqual({
      applyBaseArmorReduction: false,
      applyBaseMagicResistanceReduction: true,
    });
    expect(resolveNaturalOrderOverlap(false, true)).toEqual({
      applyBaseArmorReduction: true,
      applyBaseMagicResistanceReduction: false,
    });
  });
});
describe('calculateRadiusWithCastRangeBonus', () => {
  it('adds positive cast range bonus after the radius talent is applied', () => {
    expect(calculateRadiusWithCastRangeBonus(1050, 25)).toBe(1075);
  });

  it('does not shrink the field for a negative bonus', () => {
    expect(calculateRadiusWithCastRangeBonus(800, -100)).toBe(800);
  });
});

describe('resolveAwakenFieldState', () => {
  it('keeps the active field radius while Natural Order is unlearned', () => {
    expect(resolveAwakenFieldState(800, 125, 0)).toEqual({
      radius: 925,
      naturalOrderEnabled: false,
    });
  });

  it('enables Natural Order effects separately after the skill is learned', () => {
    expect(resolveAwakenFieldState(800, 125, 1)).toEqual({
      radius: 925,
      naturalOrderEnabled: true,
    });
  });
});
describe('shouldOverrideNaturalOrderRadius', () => {
  it('overrides only Natural Order radius while field mode is enabled', () => {
    expect(shouldOverrideNaturalOrderRadius(true, 'elder_titan_natural_order', 'radius')).toBe(
      true,
    );
    expect(shouldOverrideNaturalOrderRadius(false, 'elder_titan_natural_order', 'radius')).toBe(
      false,
    );
    expect(
      shouldOverrideNaturalOrderRadius(true, 'elder_titan_natural_order_spirit', 'radius'),
    ).toBe(false);
    expect(
      shouldOverrideNaturalOrderRadius(true, 'elder_titan_natural_order', 'awaken_radius'),
    ).toBe(false);
  });
});

describe('shouldTrackPendingSpiritReturn', () => {
  it('tracks a spirit cast that was already active before awakening', () => {
    expect(shouldTrackPendingSpiritReturn(false)).toBe(true);
    expect(shouldTrackPendingSpiritReturn(true)).toBe(false);
  });
});

describe('shouldRestoreAwakenWrapper', () => {
  const shouldRestore = (waitingForReturn: boolean, returnHidden: boolean): boolean =>
    shouldRestoreAwakenWrapper({ waitingForReturn, returnHidden });

  it('restores only after a delegated spirit cast has returned and hidden the return ability', () => {
    expect(shouldRestore(true, true)).toBe(true);
    expect(shouldRestore(true, false)).toBe(false);
    expect(shouldRestore(false, true)).toBe(false);
  });
});

describe('isEligibleRealHeroTarget', () => {
  it('accepts only real heroes and excludes illusions, clones, doubles, and creep heroes', () => {
    expect(
      isEligibleRealHeroTarget({
        isRealHero: true,
        isIllusion: false,
        isClone: false,
        isTempestDouble: false,
        isCreepHero: false,
      }),
    ).toBe(true);

    for (const excluded of [
      { isIllusion: true },
      { isClone: true },
      { isTempestDouble: true },
      { isCreepHero: true },
    ]) {
      expect(
        isEligibleRealHeroTarget({
          isRealHero: true,
          isIllusion: false,
          isClone: false,
          isTempestDouble: false,
          isCreepHero: false,
          ...excluded,
        }),
      ).toBe(false);
    }

    expect(
      isEligibleRealHeroTarget({
        isRealHero: false,
        isIllusion: false,
        isClone: false,
        isTempestDouble: false,
        isCreepHero: false,
      }),
    ).toBe(false);
  });
});

describe('isEligibleFieldTarget', () => {
  const enemyCreep = {
    isAlive: true,
    isOpposingTeam: true,
    isNeutralUnit: false,
    isBuilding: false,
    isWard: false,
    isCourier: false,
  };

  it('accepts opposing and neutral non-hero units', () => {
    expect(isEligibleFieldTarget(enemyCreep)).toBe(true);
    expect(
      isEligibleFieldTarget({ ...enemyCreep, isOpposingTeam: false, isNeutralUnit: true }),
    ).toBe(true);
  });

  it('rejects friendly units and non-unit targets', () => {
    expect(isEligibleFieldTarget({ ...enemyCreep, isOpposingTeam: false })).toBe(false);
    for (const excluded of ['isBuilding', 'isWard', 'isCourier'] as const) {
      expect(isEligibleFieldTarget({ ...enemyCreep, [excluded]: true })).toBe(false);
    }
    expect(isEligibleFieldTarget({ ...enemyCreep, isAlive: false })).toBe(false);
  });
});
describe('calculateFieldBonuses', () => {
  const values = {
    damagePerCreep: 11,
    damagePerHero: 59,
    movePctPerCreep: 1.5,
    movePctPerHero: 6,
    movePctCap: 40,
    attackSpeedPerRealHero: 20,
    attackSpeedCap: 150,
  };

  it('keeps native creep/hero attack and move scaling', () => {
    expect(calculateFieldBonuses({ creeps: 3, heroLike: 2, realHeroes: 1 }, values)).toEqual({
      attackDamage: 151,
      moveSpeedPct: 16.5,
      attackSpeed: 20,
    });
  });

  it('caps movement speed at 40% and awakened attack speed at 150', () => {
    expect(calculateFieldBonuses({ creeps: 20, heroLike: 10, realHeroes: 9 }, values)).toEqual({
      attackDamage: 810,
      moveSpeedPct: 40,
      attackSpeed: 150,
    });
  });
});

describe('calculateBonusArmorReductionDelta', () => {
  it('reduces the real bonus armor without double-counting an existing native base reduction', () => {
    // 20 base armor reduced by native Natural Order to 12, plus 12 bonus armor = 24 total.
    expect(calculateBonusArmorReductionDelta(20, 24, 40, true, true)).toBeCloseTo(-4.8);
  });

  it('does nothing to bonus armor while the field is not actively empowered', () => {
    expect(calculateBonusArmorReductionDelta(20, 24, 40, false, true)).toBe(0);
  });

  it('derives bonus armor from the unreduced base outside the native aura radius', () => {
    expect(calculateBonusArmorReductionDelta(20, 32, 40, true, false)).toBeCloseTo(-4.8);
  });
});

describe('calculateDefenseReduction', () => {
  it('reduces only base armor while the active field is off', () => {
    expect(calculateDefenseReduction(20, 12, 40, false)).toEqual({
      baseAfter: 12,
      bonusAfter: 12,
    });
  });

  it('reduces positive base and bonus armor while the active field is on', () => {
    expect(calculateDefenseReduction(20, 12, 40, true)).toEqual({
      baseAfter: 12,
      bonusAfter: 7.2,
    });
  });

  it('does not turn negative bonus armor into a benefit', () => {
    expect(calculateDefenseReduction(20, -8, 100, true)).toEqual({
      baseAfter: 0,
      bonusAfter: -8,
    });
  });
});

describe('calculateMagicResistanceTarget', () => {
  it('removes only the base contribution while the active field is off', () => {
    // 25% base + 20% bonus source = 40% total. Removing 100% base leaves 20%.
    expect(calculateMagicResistanceTarget(40, 25, 100, false)).toBeCloseTo(20);
  });

  it('subtracts the empowered reduction as percentage points from total resistance', () => {
    expect(calculateMagicResistanceTarget(73, 25, 100, true)).toBeCloseTo(-27);
    expect(calculateMagicResistanceTarget(135, 25, 100, true)).toBeCloseTo(35);
  });

  it.each([
    [40, 33],
    [55, 18],
    [70, 3],
    [85, -12],
  ])('subtracts a level reduction of %d percentage points', (reduction, expected) => {
    expect(calculateMagicResistanceTarget(73, 25, reduction, true)).toBeCloseTo(expected);
  });

  it('allows empowered resistance to fall below zero', () => {
    expect(calculateMagicResistanceTarget(20, 25, 55, true)).toBeCloseTo(-35);
  });

  it('reconstructs the pre-native total before applying the empowered reduction', () => {
    // Raw 73% total with 25% base contains a 64% bonus source. Native 40% base reduction
    // changes the observed total to 69.4%, but the awakened target remains 73 - 40 = 33%.
    expect(calculateMagicResistanceTarget(69.4, 25, 40, false, true)).toBeCloseTo(69.4);
    expect(calculateMagicResistanceTarget(69.4, 25, 40, true, true)).toBeCloseTo(33);
  });
});
