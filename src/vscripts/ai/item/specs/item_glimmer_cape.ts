import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 微光披风：交战中救残血的队友或自己。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_glimmer_cape',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: {
          healthPercent: { lte: 35 },
          noModifier: ['modifier_item_glimmer_cape_fade'],
        },
      },
      self: { enemyHeroInRange: 1200 },
    },
  },
];
