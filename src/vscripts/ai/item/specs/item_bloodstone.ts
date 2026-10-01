import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 血精石：交战中残血时开启回复。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_bloodstone',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.Self,
    condition: {
      self: { unitCondition: { healthPercent: { lte: 40 } }, enemyHeroInRange: 1200 },
    },
  },
];
