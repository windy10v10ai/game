import { retreatPointFromDanger } from './tower-retreat';

describe('tower retreat point', () => {
  it('moves only the required distance directly away from the tower', () => {
    expect(
      retreatPointFromDanger({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: -1000, y: 0 }, 250),
    ).toEqual({ x: -250, y: 0 });
  });

  it('uses the fountain direction when hero and tower positions overlap', () => {
    expect(
      retreatPointFromDanger({ x: 100, y: 100 }, { x: 100, y: 100 }, { x: 0, y: 100 }, 200),
    ).toEqual({ x: -100, y: 100 });
  });
});
