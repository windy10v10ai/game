import { resolveChaseFront } from './push-staging';

const base = {
  targetForward: 7000,
  tier4Forwards: [9000, 9200],
  baseForward: 9500,
  outerTowersLeft: false,
  tower3Pushed: false,
};

describe('chase front', () => {
  it('stops at the push target while outer towers stand', () => {
    expect(resolveChaseFront({ ...base, outerTowersLeft: true })).toBe(7000);
  });

  it('reaches the outer tier 4 tower while all three tier 3 towers stand', () => {
    expect(resolveChaseFront(base)).toBe(8300);
  });

  it('reaches the base once any tier 3 tower is down', () => {
    expect(resolveChaseFront({ ...base, tower3Pushed: true })).toBe(9100);
  });

  it('keeps the push target when it is already deeper than the chase line', () => {
    expect(resolveChaseFront({ ...base, tower3Pushed: true, targetForward: 9300 })).toBe(9300);
  });

  it('falls back to the push target when the base is gone', () => {
    expect(resolveChaseFront({ ...base, tower3Pushed: true, baseForward: undefined })).toBe(7000);
  });

  it('falls back to the push target when no tier 4 tower is left', () => {
    expect(resolveChaseFront({ ...base, tier4Forwards: [] })).toBe(7000);
  });
});
