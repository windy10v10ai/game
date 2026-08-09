import { advanceTrackingProjectile } from './fountain-anti-camp-logic';

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
