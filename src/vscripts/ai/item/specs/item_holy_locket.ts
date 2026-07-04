import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 圣洁吊坠：对友方残血英雄治疗。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_holy_locket',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 40 } } },
    },
  },
];
