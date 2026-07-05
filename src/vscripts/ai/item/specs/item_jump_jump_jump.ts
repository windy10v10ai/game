import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 跳跳跳刀：POINT 施法，濒死时不浪费，需要一定血量才用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_jump_jump_jump',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { healthPercent: { gte: 20 } } },
    },
  },
];
