import {
  calculateQuickeningCooldownPlans,
  getQuickeningCooldownReduction,
  isQuickeningDeathInRange,
} from './abaddon-quickening-logic';

describe('Abaddon Quickening death reduction', () => {
  it('uses six seconds for a hero death', () => {
    expect(getQuickeningCooldownReduction(true, 6, 0.5)).toBe(6);
  });

  it('uses half a second for every non-hero death', () => {
    expect(getQuickeningCooldownReduction(false, 6, 0.5)).toBe(0.5);
  });

  it('triggers only inside the configured radius', () => {
    expect(isQuickeningDeathInRange(900, 900)).toBe(true);
    expect(isQuickeningDeathInRange(900.01, 900)).toBe(false);
  });
});

describe('Abaddon Quickening cooldown plans', () => {
  it('reduces active ability and item cooldowns', () => {
    expect(
      calculateQuickeningCooldownPlans(
        [
          { entityIndex: 11, remainingCooldown: 10 },
          { entityIndex: 22, remainingCooldown: 8 },
        ],
        6,
      ),
    ).toEqual([
      { entityIndex: 11, nextCooldown: 4 },
      { entityIndex: 22, nextCooldown: 2 },
    ]);
  });

  it('never restarts a cooldown below zero', () => {
    expect(
      calculateQuickeningCooldownPlans([{ entityIndex: 11, remainingCooldown: 3 }], 6),
    ).toEqual([{ entityIndex: 11, nextCooldown: 0 }]);
  });

  it('ignores ready abilities and deduplicates the same item entity', () => {
    expect(
      calculateQuickeningCooldownPlans(
        [
          { entityIndex: 11, remainingCooldown: 0 },
          { entityIndex: 22, remainingCooldown: 9 },
          { entityIndex: 22, remainingCooldown: 9 },
        ],
        0.5,
      ),
    ).toEqual([{ entityIndex: 22, nextCooldown: 8.5 }]);
  });
});
