import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 暗影咒灭：纯伤害，简单粗暴直接放。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_shadow_impact',
    targetSide: TargetSide.EnemyHero,
  },
];
