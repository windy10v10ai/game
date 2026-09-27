import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 清莲宝珠 / 圣女白莲（升级链）：对友方残血英雄使用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_saint_orb',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 80 } } },
    },
  },
  {
    itemName: 'item_lotus_orb',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 80 } } },
    },
  },
];
