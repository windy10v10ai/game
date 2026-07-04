import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 不朽之心：治疗类，1200 内有敌人且残血才用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_undying_heart',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 50 } } },
    },
  },
];
