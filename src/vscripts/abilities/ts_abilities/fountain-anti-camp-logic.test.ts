import {
  advanceTrackingProjectile,
  getRetaliationHealthAfterHit,
  isInsideFountainArea,
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
});
