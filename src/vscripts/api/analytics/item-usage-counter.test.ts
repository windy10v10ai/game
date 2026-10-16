import { ItemUsageCounter } from './item-usage-counter';

describe('ItemUsageCounter', () => {
  it('weights time by copies and keeps items that disappear from later samples', () => {
    const counter = new ItemUsageCounter();
    counter.Add(['item_blink', 'item_blink', 'item_recipe_blink', 'item_boots'], 30);
    counter.Add(['item_blink'], 30);
    counter.Add(['item_blink'], 7.4);

    expect(counter.GetItems()).toEqual([
      { itemName: 'item_blink', durationSec: 97 },
      { itemName: 'item_boots', durationSec: 30 },
    ]);
  });

  it('rounds after accumulation and ignores intervals without game time', () => {
    const counter = new ItemUsageCounter();
    counter.Add(['item_blink'], 0.4);
    counter.Add(['item_blink'], 0.4);
    counter.Add(['item_boots'], 0);
    counter.Add(['item_boots'], -10);
    counter.Add([], 30);

    expect(counter.GetItems()).toEqual([{ itemName: 'item_blink', durationSec: 1 }]);
    expect(new ItemUsageCounter().GetItems()).toEqual([]);
  });
});
