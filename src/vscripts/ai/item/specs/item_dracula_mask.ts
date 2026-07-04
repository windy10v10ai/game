import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 生命之盔：吸血类，900 内有敌人且残血才用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_dracula_mask',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 60 } } },
    },
  },
];
