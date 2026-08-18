import {
  calculateMorphlingFlowCooldownSpeedBonus,
  calculateMorphlingFlowSpellAmplification,
  roundMorphlingFlowTooltipValue,
} from './morphling-flow-echo-math';

describe('Morphling Flow Echo math', () => {
  it.each([
    [100, 5, 20],
    [250, 5, 50],
    [400, 5, 80],
    [1000, 5, 200],
    [102.5, 5, 20.5],
  ])('converts %s agility with divisor %s into %s%% spell amp', (agility, divisor, expected) => {
    expect(calculateMorphlingFlowSpellAmplification(agility, divisor)).toBe(expected);
  });

  it.each([
    [100, 50, 0],
    [100, 100, 24],
    [100, 150, 48],
    [100, 175, 60],
    [100, 200, 60],
    [33, 16, 0],
    [16, 33, 60],
    [494, 231, 0],
  ])(
    'maps %s agility and %s strength to %s%% cooldown reduction',
    (agility, strength, expected) => {
      expect(calculateMorphlingFlowCooldownSpeedBonus(agility, strength, 50, 175, 60)).toBe(
        expected,
      );
    },
  );

  it('keeps cooldown scaling continuous between integer ratios', () => {
    expect(calculateMorphlingFlowCooldownSpeedBonus(100, 101, 50, 175, 60)).toBeCloseTo(24.48, 10);
  });

  it('uses one as the safe agility denominator', () => {
    expect(calculateMorphlingFlowCooldownSpeedBonus(0, 1, 50, 175, 60)).toBe(24);
  });

  it.each([
    [20.54, 20.5],
    [24.48, 24.5],
    [60, 60],
  ])('rounds %s to %s for the modifier tooltip', (value, expected) => {
    expect(roundMorphlingFlowTooltipValue(value)).toBe(expected);
  });

  it.each([
    [-1, 5],
    [100, 0],
    [100, -5],
    [Number.NaN, 5],
  ])('returns zero spell amp for invalid input (%s, %s)', (agility, divisor) => {
    expect(calculateMorphlingFlowSpellAmplification(agility, divisor)).toBe(0);
  });

  it.each([
    [-1, 100, 50, 175, 60],
    [100, -1, 50, 175, 60],
    [100, 100, 175, 50, 60],
    [100, 100, 50, 175, 0],
    [Number.NaN, 100, 50, 175, 60],
  ])(
    'returns zero cooldown speed for invalid values',
    (agility, strength, minimumRatio, maximumRatio, maximumBonus) => {
      expect(
        calculateMorphlingFlowCooldownSpeedBonus(
          agility,
          strength,
          minimumRatio,
          maximumRatio,
          maximumBonus,
        ),
      ).toBe(0);
    },
  );
});
