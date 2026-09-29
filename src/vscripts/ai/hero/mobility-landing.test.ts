import { engageLanding, landingToward } from './mobility-landing';

describe('landingToward', () => {
  it('moves a full range toward the destination', () => {
    expect(landingToward({ x: 0, y: 0 }, { x: 3000, y: 0 }, 1200)).toEqual({ x: 1200, y: 0 });
  });

  it('keeps the move when the rest of the way is shorter than one full range', () => {
    expect(landingToward({ x: 0, y: 0 }, { x: 1000, y: 0 }, 1200)).toBeUndefined();
  });

  it('skips a range too short to be real', () => {
    expect(landingToward({ x: 0, y: 0 }, { x: 3000, y: 0 }, 300)).toBeUndefined();
  });
});

describe('engageLanding', () => {
  it('lands on a melee target', () => {
    expect(engageLanding({ x: 0, y: 0 }, { x: 1000, y: 0 }, 1200, 0)).toEqual({ x: 1000, y: 0 });
  });

  it('keeps a ranged hero at its stand-off distance', () => {
    expect(engageLanding({ x: 0, y: 0 }, { x: 1400, y: 0 }, 1200, 600)).toEqual({
      x: 800,
      y: 0,
    });
  });

  it('skips targets already close or out of reach', () => {
    expect(engageLanding({ x: 0, y: 0 }, { x: 400, y: 0 }, 1200, 0)).toBeUndefined();
    expect(engageLanding({ x: 0, y: 0 }, { x: 2000, y: 0 }, 1200, 0)).toBeUndefined();
  });
});
