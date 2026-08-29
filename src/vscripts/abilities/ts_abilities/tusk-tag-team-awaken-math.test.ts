import { addTagTeamStoredDamage, calculateTagTeamExtraDamage } from './tusk-tag-team-awaken-math';

describe('addTagTeamStoredDamage', () => {
  it('stores 50% of damage actually taken', () => {
    expect(addTagTeamStoredDamage(0, 10000, 50)).toBe(5000);
  });

  it('accumulates damage across the current activation', () => {
    expect(addTagTeamStoredDamage(250, 5000, 50)).toBe(2750);
  });

  it('does not reduce the pool for invalid negative inputs', () => {
    expect(addTagTeamStoredDamage(250, -100, 50)).toBe(250);
  });
});

describe('calculateTagTeamExtraDamage', () => {
  it('adds only stored damage to attacks because native Tag Team already adds its base bonus', () => {
    expect(calculateTagTeamExtraDamage(100, 1000, true)).toBe(1000);
  });

  it('adds native and stored damage to spell and item damage', () => {
    expect(calculateTagTeamExtraDamage(100, 1000, false)).toBe(1100);
  });
});
