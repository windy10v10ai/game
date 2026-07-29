import {
  beginCentaurDamageCycle,
  calculateCentaurDoubleEdgeNormalDamage,
  calculateCentaurShieldAmount,
  calculateCentaurStoredDamage,
  canCentaurAccumulateDamage,
  filterRecentCentaurDamage,
  mergeCentaurShieldAmount,
  restoreCancelledCentaurDamageCycle,
  shouldFinishCentaurDamageCycle,
} from './centaur-awaken-math';

describe('filterRecentCentaurDamage', () => {
  it('keeps damage from the latest six seconds including the boundary', () => {
    expect(
      filterRecentCentaurDamage(
        [
          { time: 3.99, damage: 999 },
          { time: 4, damage: 100 },
          { time: 7, damage: 200 },
          { time: 10, damage: 300 },
        ],
        10,
        6,
      ),
    ).toEqual([
      { time: 4, damage: 100 },
      { time: 7, damage: 200 },
      { time: 10, damage: 300 },
    ]);
  });

  it('drops non-positive damage samples', () => {
    expect(
      filterRecentCentaurDamage(
        [
          { time: 9, damage: -10 },
          { time: 9.5, damage: 0 },
          { time: 10, damage: 50 },
        ],
        10,
        6,
      ),
    ).toEqual([{ time: 10, damage: 50 }]);
  });
});

describe('calculateCentaurDoubleEdgeNormalDamage', () => {
  it('adds the configured percentage of current strength to base damage', () => {
    expect(calculateCentaurDoubleEdgeNormalDamage(540, 1000, 180)).toBe(2340);
  });

  it('does not produce negative normal damage', () => {
    expect(calculateCentaurDoubleEdgeNormalDamage(-100, -50, 180)).toBe(0);
  });
});

describe('calculateCentaurStoredDamage', () => {
  it('converts 100% of recent effective damage', () => {
    expect(calculateCentaurStoredDamage(8000, 100, 2000, 600)).toBe(8000);
  });

  it('caps the bonus at 600% of normal Double Edge damage', () => {
    expect(calculateCentaurStoredDamage(20000, 100, 2000, 600)).toBe(12000);
  });

  it('clamps invalid negative values to zero', () => {
    expect(calculateCentaurStoredDamage(-100, 100, 2000, 600)).toBe(0);
  });
});

describe('calculateCentaurShieldAmount', () => {
  it('converts 60% of the consumed stored damage into an all-damage shield', () => {
    expect(calculateCentaurShieldAmount(12000, 60)).toBe(7200);
  });
});

describe('mergeCentaurShieldAmount', () => {
  it('keeps the higher remaining shield instead of stacking', () => {
    expect(mergeCentaurShieldAmount(5000, 3000)).toBe(5000);
    expect(mergeCentaurShieldAmount(5000, 7000)).toBe(7000);
  });
});

describe('Centaur Double Edge damage cycles', () => {
  it('moves only the latest six seconds into the cast snapshot and starts a new cycle', () => {
    expect(
      beginCentaurDamageCycle(
        [
          { time: 3.99, damage: 100 },
          { time: 4, damage: 200 },
          { time: 9, damage: 300 },
        ],
        10,
        6,
      ),
    ).toEqual({
      pendingSamples: [
        { time: 4, damage: 200 },
        { time: 9, damage: 300 },
      ],
      currentSamples: [],
    });
  });

  it('restores both sides of a cancelled cast while keeping the six-second limit', () => {
    expect(
      restoreCancelledCentaurDamageCycle(
        [
          { time: 4, damage: 100 },
          { time: 8, damage: 200 },
        ],
        [{ time: 10, damage: 300 }],
        11,
        6,
      ),
    ).toEqual([
      { time: 8, damage: 200 },
      { time: 10, damage: 300 },
    ]);
  });
});

describe('shouldFinishCentaurDamageCycle', () => {
  it('treats a landed Double Edge hit as successful even before the fully-cast event settles', () => {
    expect(shouldFinishCentaurDamageCycle(false, 5000)).toBe(true);
    expect(shouldFinishCentaurDamageCycle(true, 0)).toBe(true);
    expect(shouldFinishCentaurDamageCycle(false, 0)).toBe(false);
  });
});

describe('canCentaurAccumulateDamage', () => {
  it('requires Double Edge to be learned and the passive to be active', () => {
    expect(canCentaurAccumulateDamage(0, false)).toBe(false);
    expect(canCentaurAccumulateDamage(1, true)).toBe(false);
    expect(canCentaurAccumulateDamage(1, false)).toBe(true);
  });
});
