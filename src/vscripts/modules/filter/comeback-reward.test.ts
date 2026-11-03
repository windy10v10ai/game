import { farmRewardBonus } from './comeback-reward';

describe('farmRewardBonus', () => {
  it.each([
    [0, 1],
    [1, 1.03],
    [6, 1.18],
    [10, 1.3],
    [11, 1.3],
  ])('should scale the reward with %i towers lost', (towersLost, expected) => {
    expect(farmRewardBonus(towersLost)).toBeCloseTo(expected, 5);
  });
});
