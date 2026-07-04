import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 真红撒旦：吸血类，900 内有敌人且残血才用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_satanic_2',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 60 } } },
    },
  },
];
