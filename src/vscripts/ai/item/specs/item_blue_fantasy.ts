import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 苍蓝幻想：纯伤害，简单粗暴直接放。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_blue_fantasy',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyHero,
  },
];
