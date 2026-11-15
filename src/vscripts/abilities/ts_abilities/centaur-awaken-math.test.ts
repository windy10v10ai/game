import {
  calculateNormalDoubleEdgeDamage,
  calculateShieldAmount,
  calculateStoredDamage,
  mergeShieldAmount,
  sumRecentDamage,
} from './centaur-awaken-math';

describe('calculateStoredDamage', () => {
  it('keeps the converted damage below the cap', () => {
    expect(calculateStoredDamage(1000, 100, 800, 300)).toBe(1000);
  });

  it('clamps to the cap', () => {
    expect(calculateStoredDamage(5000, 100, 800, 300)).toBe(2400);
  });
});

describe('sumRecentDamage', () => {
  it('drops samples that slid out of the window', () => {
    const samples = [
      { time: 0, damage: 500 },
      { time: 5, damage: 300 },
    ];
    expect(sumRecentDamage(samples, 7, 6)).toBe(300);
  });

  it('keeps a sample exactly on the window edge', () => {
    expect(sumRecentDamage([{ time: 1, damage: 200 }], 7, 6)).toBe(200);
  });
});

describe('calculateNormalDoubleEdgeDamage', () => {
  it('adds the strength part to the base damage', () => {
    expect(calculateNormalDoubleEdgeDamage(540, 100, 180)).toBe(720);
  });
});

describe('shield', () => {
  it('converts the consumed damage by the shield percent', () => {
    expect(calculateShieldAmount(2400, 100)).toBe(2400);
  });

  it('keeps the larger remaining shield when merging', () => {
    expect(mergeShieldAmount(1000, 600)).toBe(1000);
  });

  it('takes the new shield when it is larger', () => {
    expect(mergeShieldAmount(300, 600)).toBe(600);
  });
});
