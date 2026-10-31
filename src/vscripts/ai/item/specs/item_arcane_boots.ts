import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 奥术鞋：自己或身边队友缺蓝时群体回蓝。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_arcane_boots',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { range: { lte: 1200 }, unitCondition: { manaPercent: { lte: 60 } } },
    },
  },
];
