import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 禁忌法锤：POINT 施法，选第一个敌人位置，无额外条件。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_forbidden_staff',
    targetSide: TargetSide.EnemyHero,
  },
];
