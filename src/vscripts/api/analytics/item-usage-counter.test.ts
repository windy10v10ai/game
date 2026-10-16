import { ItemUsageCounter } from './item-usage-counter';

describe('ItemUsageCounter', () => {
  it('weights time by copies and keeps items that disappear from later samples', () => {
    const counter = new ItemUsageCounter();
    counter.Add(['item_blink', 'item_blink', 'item_recipe_blink', 'item_boots'], 30, 0);
    counter.Add(['item_blink'], 30, 0);
    counter.Add(['item_blink'], 7.4, 0);

    expect(counter.GetItems()).toEqual([
      { itemName: 'item_blink', durationSec: 97, lateDurationSec: 0 },
      { itemName: 'item_boots', durationSec: 30, lateDurationSec: 0 },
    ]);
  });

  it('accumulates the late part of intervals that cross into the late game', () => {
    const counter = new ItemUsageCounter();
    counter.Add(['item_blink', 'item_blink'], 30, 12);
    counter.Add(['item_blink'], 30, 30);

    expect(counter.GetItems()).toEqual([
      { itemName: 'item_blink', durationSec: 90, lateDurationSec: 54 },
    ]);
  });

  it('rounds after accumulation and ignores intervals without game time', () => {
    const counter = new ItemUsageCounter();
    counter.Add(['item_blink'], 0.4, 0.4);
    counter.Add(['item_blink'], 0.4, 0.4);
    counter.Add(['item_boots'], 0, 0);
    counter.Add(['item_boots'], -10, 0);
    counter.Add([], 30, 30);

    expect(counter.GetItems()).toEqual([
      { itemName: 'item_blink', durationSec: 1, lateDurationSec: 1 },
    ]);
    expect(new ItemUsageCounter().GetItems()).toEqual([]);
  });
});
