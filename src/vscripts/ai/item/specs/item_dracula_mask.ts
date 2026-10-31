import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 生命之盔：吸血类，附近有敌人且残血才用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_dracula_mask',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 60 } } },
    },
  },
];
