import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 虚灵之刃：纯伤害，简单粗暴直接放。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_ethereal_blade',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyHero,
  },
];
