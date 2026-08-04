import {
  getWispTetherMoveSpeedFloor,
  getWispTetherMoveSpeedOverride,
  getWispTetherTransferredDamage,
  getWispTetherSharedAttribute,
  getWispTetherShareableAttribute,
  canClaimWispTetherTargetBenefits,
} from './wisp-tether-awaken-logic';

describe('getWispTetherMoveSpeedFloor', () => {
  it('preserves Wisp untethered speed when native Tether would lower it', () => {
    expect(getWispTetherMoveSpeedFloor(824, 550)).toBe(824);
  });

  it('still follows a tether target that is faster than Wisp', () => {
    expect(getWispTetherMoveSpeedFloor(500, 760)).toBe(760);
  });
});

describe('getWispTetherMoveSpeedOverride', () => {
  it('returns the synchronized speed only for Wisp itself', () => {
    expect(getWispTetherMoveSpeedOverride(true, 824)).toBe(824);
    expect(getWispTetherMoveSpeedOverride(false, 824)).toBe(0);
  });
});

describe('getWispTetherTransferredDamage', () => {
  it('reconstructs the redirected share from the damage received after reduction', () => {
    expect(getWispTetherTransferredDamage(80, 20)).toBe(20);
  });

  it('does not transfer zero damage, an invalid full share, or reflected damage', () => {
    expect(getWispTetherTransferredDamage(0, 20)).toBe(0);
    expect(getWispTetherTransferredDamage(80, 0)).toBe(0);
    expect(getWispTetherTransferredDamage(80, 100)).toBe(0);
    expect(getWispTetherTransferredDamage(80, 20, true)).toBe(0);
  });
});

describe('getWispTetherSharedAttribute', () => {
  it('shares the configured percentage of Wisp current attributes', () => {
    expect(getWispTetherSharedAttribute(250, 10)).toBe(25);
  });

  it('does not create negative shared attributes', () => {
    expect(getWispTetherSharedAttribute(-50, 10)).toBe(0);
    expect(getWispTetherSharedAttribute(250, 0)).toBe(0);
  });
});

describe('getWispTetherShareableAttribute', () => {
  it('excludes attributes received from another awakened Tether provider', () => {
    expect(getWispTetherShareableAttribute(110, 10)).toBe(100);
  });

  it('never produces a negative shareable attribute', () => {
    expect(getWispTetherShareableAttribute(8, 10)).toBe(0);
  });
});

describe('canClaimWispTetherTargetBenefits', () => {
  it('allows the first awakened Wisp to provide the target benefits', () => {
    expect(canClaimWispTetherTargetBenefits([], 101)).toBe(true);
  });

  it('keeps the existing provider without adding another damage reduction or attribute share', () => {
    expect(canClaimWispTetherTargetBenefits([101], 101)).toBe(true);
    expect(canClaimWispTetherTargetBenefits([101], 202)).toBe(false);
  });

  it('rejects both contenders while duplicate providers are being collapsed', () => {
    expect(canClaimWispTetherTargetBenefits([101, 202], 101)).toBe(false);
    expect(canClaimWispTetherTargetBenefits([101, 202], 202)).toBe(false);
  });
});
