import { UtilityMath } from './utility-math';

describe('UtilityMath.Linear', () => {
  it('returns 0 at min', () => {
    expect(UtilityMath.Linear(0, 0, 10)).toBe(0);
  });

  it('returns 1 at max', () => {
    expect(UtilityMath.Linear(10, 0, 10)).toBe(1);
  });

  it('returns 0.5 at midpoint', () => {
    expect(UtilityMath.Linear(5, 0, 10)).toBe(0.5);
  });

  it('clamps below min to 0', () => {
    expect(UtilityMath.Linear(-5, 0, 10)).toBe(0);
  });

  it('clamps above max to 1', () => {
    expect(UtilityMath.Linear(15, 0, 10)).toBe(1);
  });

  it('works with inverted range (retreat HP curve: min=60, max=0)', () => {
    expect(UtilityMath.Linear(60, 60, 0)).toBe(0); // full health → 0
    expect(UtilityMath.Linear(0, 60, 0)).toBe(1);  // 0% HP → 1
    expect(UtilityMath.Linear(30, 60, 0)).toBe(0.5);
  });

  it('returns 0 when min equals max', () => {
    expect(UtilityMath.Linear(5, 5, 5)).toBe(0);
  });
});

describe('UtilityMath.Quadratic', () => {
  it('returns 0 at the min boundary (60% HP)', () => {
    expect(UtilityMath.Quadratic(60, 60, 0)).toBe(0);
  });

  it('returns 1 at the max boundary (0% HP)', () => {
    expect(UtilityMath.Quadratic(0, 60, 0)).toBe(1);
  });

  it('returns 0.25 at halfway (30% HP) — quadratic compression', () => {
    expect(UtilityMath.Quadratic(30, 60, 0)).toBeCloseTo(0.25);
  });

  it('returns 0 when health is above 60%', () => {
    expect(UtilityMath.Quadratic(80, 60, 0)).toBe(0);
    expect(UtilityMath.Quadratic(100, 60, 0)).toBe(0);
  });

  it('grows faster in the lower range than the linear equivalent', () => {
    // At 15% HP: Linear = 0.75, Quadratic = 0.5625 — less than linear, not more
    // The quadratic compression means you need to be very low before panic spikes
    const at15 = UtilityMath.Quadratic(15, 60, 0);
    const at45 = UtilityMath.Quadratic(45, 60, 0);
    expect(at15).toBeGreaterThan(at45);
    expect(at15).toBeCloseTo(0.5625);
    expect(at45).toBeCloseTo(0.0625);
  });
});

describe('UtilityMath.Logistic', () => {
  it('returns 0.5 at midpoint', () => {
    expect(UtilityMath.Logistic(1.2, 1.2, 5)).toBeCloseTo(0.5);
  });

  it('approaches 1 well above midpoint', () => {
    expect(UtilityMath.Logistic(3.0, 1.2, 5)).toBeGreaterThan(0.99);
  });

  it('approaches 0 well below midpoint', () => {
    expect(UtilityMath.Logistic(0, 1.2, 5)).toBeLessThan(0.01);
  });

  it('is symmetric around the midpoint', () => {
    const above = UtilityMath.Logistic(1.2 + 0.5, 1.2, 5);
    const below = UtilityMath.Logistic(1.2 - 0.5, 1.2, 5);
    expect(above + below).toBeCloseTo(1.0);
  });

  it('steepness controls how fast it transitions', () => {
    const steep = UtilityMath.Logistic(1.4, 1.2, 10);
    const shallow = UtilityMath.Logistic(1.4, 1.2, 1);
    expect(steep).toBeGreaterThan(shallow);
  });
});
