import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 圣女白莲：对友方残血英雄治疗。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_saint_orb',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 80 } } },
    },
  },
];
