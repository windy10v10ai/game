import {
  advanceTrackingProjectile,
  captureLatestRewardValues,
  clampExcludedDamage,
  getRetaliationHealthAfterHit,
  isInsideFountainArea,
  isProjectileWithinHitRadius,
  shouldArmRewardSuppression,
} from './fountain-anti-camp-logic';

describe('fountain anti-camp pure logic', () => {
  describe('isInsideFountainArea', () => {
    const center = { x: 100, y: 200 };

    it('includes points on the radius boundary', () => {
      expect(isInsideFountainArea({ x: 400, y: 600 }, center, 500)).toBe(true);
    });

    it('rejects points outside the radius', () => {
      expect(isInsideFountainArea({ x: 401, y: 600 }, center, 500)).toBe(false);
    });

    it('rejects a non-positive radius', () => {
      expect(isInsideFountainArea(center, center, 0)).toBe(false);
      expect(isInsideFountainArea(center, center, -1)).toBe(false);
    });
  });

  describe('shouldArmRewardSuppression', () => {
    it('arms before a protected hit that can kill the AI hero', () => {
      expect(shouldArmRewardSuppression(1200, 1200)).toBe(true);
      expect(shouldArmRewardSuppression(1200, 1600)).toBe(true);
    });

    it('does not arm for non-lethal or invalid damage', () => {
      expect(shouldArmRewardSuppression(1200, 1199)).toBe(false);
      expect(shouldArmRewardSuppression(1200, 0)).toBe(false);
      expect(shouldArmRewardSuppression(0, 1200)).toBe(false);
    });
  });

  describe('captureLatestRewardValues', () => {
    it('keeps the saved rewards while protected values remain zero', () => {
      expect(
        captureLatestRewardValues(
          { minimumGold: 200, maximumGold: 300, deathXp: 450 },
          { minimumGold: 0, maximumGold: 0, deathXp: 0 },
        ),
      ).toEqual({ minimumGold: 200, maximumGold: 300, deathXp: 450 });
    });

    it('captures values rewritten by another global system', () => {
      expect(
        captureLatestRewardValues(
          { minimumGold: 200, maximumGold: 300, deathXp: 450 },
          { minimumGold: 240, maximumGold: 360, deathXp: 700 },
        ),
      ).toEqual({ minimumGold: 240, maximumGold: 360, deathXp: 700 });
    });

    it('captures each non-zero field independently', () => {
      expect(
        captureLatestRewardValues(
          { minimumGold: 200, maximumGold: 300, deathXp: 450 },
          { minimumGold: 0, maximumGold: 360, deathXp: 0 },
        ),
      ).toEqual({ minimumGold: 200, maximumGold: 360, deathXp: 450 });
    });
  });

  describe('advanceTrackingProjectile', () => {
    it('moves toward a moving target by the configured frame distance', () => {
      expect(advanceTrackingProjectile({ x: 0, y: 0 }, { x: 300, y: 400 }, 100, 32)).toEqual({
        position: { x: 60, y: 80 },
        reached: false,
      });
    });

    it('reports impact when one frame can reach the target hit radius', () => {
      expect(advanceTrackingProjectile({ x: 0, y: 0 }, { x: 120, y: 0 }, 40, 80)).toEqual({
        position: { x: 40, y: 0 },
        reached: true,
      });
    });
  });
  describe('isProjectileWithinHitRadius', () => {
    it('hits when the tracking projectile reaches the target radius', () => {
      expect(isProjectileWithinHitRadius({ x: 100, y: 100 }, { x: 160, y: 180 }, 100)).toBe(true);
    });

    it('keeps tracking while the projectile remains outside the target radius', () => {
      expect(isProjectileWithinHitRadius({ x: 100, y: 100 }, { x: 201, y: 100 }, 100)).toBe(false);
    });
  });

  describe('getRetaliationHealthAfterHit', () => {
    it('subtracts the full requested retaliation damage', () => {
      expect(getRetaliationHealthAfterHit(8000, 5000)).toBe(3000);
    });

    it('clamps lethal retaliation at zero health', () => {
      expect(getRetaliationHealthAfterHit(3000, 5000)).toBe(0);
    });

    it('does not heal when the requested damage is negative', () => {
      expect(getRetaliationHealthAfterHit(3000, -500)).toBe(3000);
    });
  });

  describe('clampExcludedDamage', () => {
    it('subtracts excluded damage from the engine total', () => {
      expect(clampExcludedDamage(1000, 350)).toBe(650);
    });

    it('never returns a negative result', () => {
      expect(clampExcludedDamage(100, 150)).toBe(0);
    });

    it('does not increase the result for a negative exclusion', () => {
      expect(clampExcludedDamage(100, -50)).toBe(100);
    });
  });
});
