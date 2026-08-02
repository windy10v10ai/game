import {
  calculateLethalDamageConstant,
  getTrueDragonFormTier,
  updateRoarDamageState,
  isWithinTrueDragonPresence,
  updateRoarInternalCooldown,
  updateRoarHealthLossState,
} from './dragon-knight-true-dragon-math';

describe('isWithinTrueDragonPresence', () => {
  it('uses the current attack range as an inclusive 2D radius', () => {
    expect(isWithinTrueDragonPresence(0, 0, 300, 400, 500)).toBe(true);
  });

  it('rejects sources beyond the current attack range', () => {
    expect(isWithinTrueDragonPresence(0, 0, 301, 400, 500)).toBe(false);
  });

  it('matches Dota attack reach by including both collision hull radii', () => {
    expect(isWithinTrueDragonPresence(0, 0, 580, 0, 500, 24, 56)).toBe(true);
    expect(isWithinTrueDragonPresence(0, 0, 581, 0, 500, 24, 56)).toBe(false);
  });

  it('rejects non-positive attack ranges', () => {
    expect(isWithinTrueDragonPresence(0, 0, 0, 0, 0)).toBe(false);
  });
});

describe('updateRoarDamageState', () => {
  it('ignores damage and clears stored progress while cooldown is active', () => {
    expect(updateRoarDamageState(900, 600, 10000, 15, false)).toEqual({
      accumulatedDamage: 0,
      shouldTrigger: false,
    });
  });

  it('starts a fresh accumulator after cooldown becomes ready', () => {
    expect(updateRoarDamageState(0, 750, 10000, 15, true)).toEqual({
      accumulatedDamage: 750,
      shouldTrigger: false,
    });
  });

  it('accumulates multiple post-mitigation hits until they reach fifteen percent', () => {
    const firstHit = updateRoarDamageState(0, 750, 10000, 15, true);
    expect(updateRoarDamageState(firstHit.accumulatedDamage, 750, 10000, 15, true)).toEqual({
      accumulatedDamage: 0,
      shouldTrigger: true,
    });
  });

  it('resets progress immediately when the threshold is reached', () => {
    expect(updateRoarDamageState(1499, 1, 10000, 15, true)).toEqual({
      accumulatedDamage: 0,
      shouldTrigger: true,
    });
  });

  it('does not save damage received during the new cooldown after a trigger', () => {
    const triggered = updateRoarDamageState(1000, 500, 10000, 15, true);
    expect(triggered).toEqual({ accumulatedDamage: 0, shouldTrigger: true });
    expect(updateRoarDamageState(triggered.accumulatedDamage, 5000, 10000, 15, false)).toEqual({
      accumulatedDamage: 0,
      shouldTrigger: false,
    });
  });

  it('uses the actual damage value passed by the damage event', () => {
    expect(updateRoarDamageState(0, 480, 10000, 15, true)).toEqual({
      accumulatedDamage: 480,
      shouldTrigger: false,
    });
  });

  it('ignores invalid damage, health and thresholds safely', () => {
    expect(updateRoarDamageState(300, 0, 10000, 15, true)).toEqual({
      accumulatedDamage: 300,
      shouldTrigger: false,
    });
    expect(updateRoarDamageState(300, 100, 0, 15, true)).toEqual({
      accumulatedDamage: 0,
      shouldTrigger: false,
    });
    expect(updateRoarDamageState(300, 100, 10000, 0, true)).toEqual({
      accumulatedDamage: 0,
      shouldTrigger: false,
    });
  });
});

describe('updateRoarInternalCooldown', () => {
  it('does not expose ability cooldown and ignores all damage before the internal cooldown ends', () => {
    expect(updateRoarInternalCooldown(900, 600, 10000, 15, 20, 21, 8)).toEqual({
      accumulatedDamage: 0,
      cooldownEndTime: 21,
      shouldTrigger: false,
    });
  });

  it('starts accumulating from zero exactly when the internal cooldown ends', () => {
    expect(updateRoarInternalCooldown(0, 750, 10000, 15, 21, 21, 8)).toEqual({
      accumulatedDamage: 750,
      cooldownEndTime: 21,
      shouldTrigger: false,
    });
  });

  it('starts a new internal cooldown when the threshold triggers', () => {
    expect(updateRoarInternalCooldown(750, 750, 10000, 15, 21, 21, 8)).toEqual({
      accumulatedDamage: 0,
      cooldownEndTime: 29,
      shouldTrigger: true,
    });
  });
});
describe('updateRoarHealthLossState', () => {
  it('counts only health that actually disappeared', () => {
    expect(updateRoarHealthLossState(1000, 900, 0, 1000, 15, 20, 20, 8)).toEqual({
      observedHealth: 900,
      accumulatedHealthLoss: 100,
      cooldownEndTime: 20,
      shouldTrigger: false,
    });
  });

  it('does not count a damage event when the health bar did not move', () => {
    expect(updateRoarHealthLossState(1000, 1000, 0, 1000, 15, 20, 20, 8)).toEqual({
      observedHealth: 1000,
      accumulatedHealthLoss: 0,
      cooldownEndTime: 20,
      shouldTrigger: false,
    });
  });

  it('keeps earlier real loss through healing and counts only the next real drop', () => {
    const firstLoss = updateRoarHealthLossState(1000, 900, 0, 1000, 50, 20, 20, 8);
    const healed = updateRoarHealthLossState(
      firstLoss.observedHealth,
      1000,
      firstLoss.accumulatedHealthLoss,
      1000,
      50,
      20,
      firstLoss.cooldownEndTime,
      8,
    );
    expect(
      updateRoarHealthLossState(
        healed.observedHealth,
        800,
        healed.accumulatedHealthLoss,
        1000,
        50,
        20,
        healed.cooldownEndTime,
        8,
      ),
    ).toEqual({
      observedHealth: 800,
      accumulatedHealthLoss: 300,
      cooldownEndTime: 20,
      shouldTrigger: false,
    });
  });

  it('clears progress and rebases observed health throughout cooldown', () => {
    expect(updateRoarHealthLossState(1000, 600, 120, 1000, 15, 20, 21, 8)).toEqual({
      observedHealth: 600,
      accumulatedHealthLoss: 0,
      cooldownEndTime: 21,
      shouldTrigger: false,
    });
  });

  it('starts fresh from the cooldown-end health baseline', () => {
    const coolingDown = updateRoarHealthLossState(1000, 600, 120, 1000, 15, 20, 21, 8);
    expect(
      updateRoarHealthLossState(
        coolingDown.observedHealth,
        500,
        coolingDown.accumulatedHealthLoss,
        1000,
        15,
        21,
        coolingDown.cooldownEndTime,
        8,
      ),
    ).toEqual({
      observedHealth: 500,
      accumulatedHealthLoss: 100,
      cooldownEndTime: 21,
      shouldTrigger: false,
    });
  });

  it('triggers at fifteen percent and starts the internal cooldown', () => {
    expect(updateRoarHealthLossState(900, 850, 100, 1000, 15, 21, 21, 8)).toEqual({
      observedHealth: 850,
      accumulatedHealthLoss: 0,
      cooldownEndTime: 29,
      shouldTrigger: true,
    });
  });
});
describe('calculateLethalDamageConstant', () => {
  it('returns a negative incoming-damage constant that leaves one health', () => {
    expect(calculateLethalDamageConstant(1200, 1000)).toBe(-201);
  });

  it('protects against an exactly lethal hit', () => {
    expect(calculateLethalDamageConstant(1000, 1000)).toBe(-1);
  });

  it('does not alter non-lethal damage', () => {
    expect(calculateLethalDamageConstant(999, 1000)).toBe(0);
  });
});

describe('getTrueDragonFormTier', () => {
  it('uses the learned ultimate level without a scepter', () => {
    expect(getTrueDragonFormTier(3, false)).toBe(3);
  });

  it('adds the inherited black-dragon tier with a scepter', () => {
    expect(getTrueDragonFormTier(3, true)).toBe(4);
  });

  it('clamps invalid and excessive levels to the four supported forms', () => {
    expect(getTrueDragonFormTier(0, false)).toBe(1);
    expect(getTrueDragonFormTier(4, true)).toBe(4);
  });
});
