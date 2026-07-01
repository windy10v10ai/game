import { GetTomePurchaseCap, PrimaryAttributeTomeWeights } from './hero-build-config-template';

describe('PrimaryAttributeTomeWeights', () => {
  it('weights strength primary attribute towards strength tomes', () => {
    const weights = PrimaryAttributeTomeWeights[Attributes.STRENGTH];
    expect(weights.strength).toBe(0.5);
    expect(weights.agility).toBe(0.25);
    expect(weights.intelligence).toBe(0.25);
  });

  it('weights agility primary attribute towards agility tomes', () => {
    const weights = PrimaryAttributeTomeWeights[Attributes.AGILITY];
    expect(weights.agility).toBe(0.5);
    expect(weights.strength).toBe(0.25);
    expect(weights.intelligence).toBe(0.25);
  });

  it('weights intellect primary attribute towards intelligence tomes', () => {
    const weights = PrimaryAttributeTomeWeights[Attributes.INTELLECT];
    expect(weights.intelligence).toBe(0.5);
    expect(weights.strength).toBe(0.25);
    expect(weights.agility).toBe(0.25);
  });

  it('spreads weights evenly for all-around primary attribute', () => {
    const weights = PrimaryAttributeTomeWeights[Attributes.ALL];
    expect(weights.strength).toBeCloseTo(1 / 3);
    expect(weights.agility).toBeCloseTo(1 / 3);
    expect(weights.intelligence).toBeCloseTo(1 / 3);
  });
});

describe('GetTomePurchaseCap', () => {
  it.each([
    [2.9, 6],
    [3, 12],
    [5.9, 12],
    [6, 20],
    [9.9, 20],
    [10, 30],
    [19.9, 30],
    [20, 45],
    [39.9, 45],
    [40, 60],
    [100, 60],
  ])('returns %d cap for multiplier %d', (multiplier, expectedCap) => {
    expect(GetTomePurchaseCap(multiplier)).toBe(expectedCap);
  });
});
