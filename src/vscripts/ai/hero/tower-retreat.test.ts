import { retreatPointFromTowers } from './tower-retreat';

describe('tower retreat point', () => {
  it('moves directly away from a single tower toward home', () => {
    expect(
      retreatPointFromTowers({ x: 0, y: 0 }, [{ x: 100, y: 0 }], { x: -1000, y: 0 }, 250),
    ).toEqual({ x: -250, y: 0 });
  });

  it('heads home when caught between two towers instead of bouncing between them', () => {
    const towers = [
      { x: -500, y: 0 },
      { x: 500, y: 0 },
    ];
    const point = retreatPointFromTowers({ x: 0, y: 0 }, towers, { x: 0, y: -3000 }, 300);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(-300);
  });

  it('uses the fountain direction when hero and tower positions overlap', () => {
    expect(
      retreatPointFromTowers({ x: 100, y: 100 }, [{ x: 100, y: 100 }], { x: 0, y: 100 }, 200),
    ).toEqual({ x: -100, y: 100 });
  });
});
