import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 魔杖：交战中残血时回复，没攒够充能不交。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_magic_wand',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.Self,
    condition: {
      self: { unitCondition: { healthPercent: { lte: 35 } }, enemyHeroInRange: 1200 },
      ability: { charges: { gte: 3 } },
    },
  },
];
