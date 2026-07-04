import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 跳跳跳刀：POINT 施法，HP>20 才用（保命/进场用，濒死不浪费）。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_jump_jump_jump',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { healthPercent: { gte: 20 } } },
    },
  },
];
