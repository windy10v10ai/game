import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 禁忌战刃：T5 纯伤害，不检控制。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_forbidden_blade',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyHero,
  },
];
