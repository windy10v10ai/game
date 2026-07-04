import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 生命之心：治疗类，1200 内有敌人且残血才用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_withered_spring',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 50 } } },
    },
  },
];
