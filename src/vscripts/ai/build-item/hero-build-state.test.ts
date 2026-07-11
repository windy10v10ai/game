import { GetT5ItemCount } from './hero-build-state';

describe('GetT5ItemCount', () => {
  it.each([
    [1, 0],
    [2.9, 0],
    [3, 1],
    [4.9, 1],
    [5, 2],
    [6.9, 2],
    [7, 3],
    [9.9, 3],
    [10, 4],
    [14.9, 4],
    [15, 5],
    [19.9, 5],
    [20, 6],
    [40, 6],
  ])('returns %d slots for multiplier %d', (multiplier, expectedCount) => {
    expect(GetT5ItemCount(multiplier)).toBe(expectedCount);
  });
});
