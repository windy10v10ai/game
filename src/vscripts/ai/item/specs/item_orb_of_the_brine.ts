import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 苍洋魔珠：对友方残血英雄治疗。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_orb_of_the_brine',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 40 } } },
    },
  },
];
