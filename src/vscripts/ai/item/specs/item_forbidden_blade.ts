import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 禁忌战刃：T5 纯伤害，不检控制。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_forbidden_blade',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { healthPercent: { gte: 20 } } },
    },
  },
];
