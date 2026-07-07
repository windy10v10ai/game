import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 虚灵之刃：纯伤害，简单粗暴直接放。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_ethereal_blade',
    targetSide: TargetSide.EnemyHero,
  },
];
