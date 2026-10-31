import { EMPTY_SLOT, planSlotSwaps } from './arrange-items';

function apply(items: number[], tiers: number[]): number[] {
  const result = [...items];
  for (const [from, to] of planSlotSwaps(tiers)) {
    [result[from], result[to]] = [result[to], result[from]];
  }
  return result;
}

describe('planSlotSwaps', () => {
  it('does nothing when already in order', () => {
    expect(planSlotSwaps([1, 2, 5, 5, 6, EMPTY_SLOT])).toEqual([]);
  });

  it('moves higher tiers forward and empty slots last', () => {
    const tiers = [6, EMPTY_SLOT, 5, 2, 1, 5];
    expect(apply(tiers, tiers)).toEqual([1, 2, 5, 5, 6, EMPTY_SLOT]);
  });

  it('keeps the original order within a tier', () => {
    expect(apply([53, 51, 20, 52], [5, 5, 2, 5])).toEqual([20, 53, 51, 52]);
  });
});
