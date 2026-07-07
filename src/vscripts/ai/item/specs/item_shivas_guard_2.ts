import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 雅典娜守护：NO_TARGET buff，范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_shivas_guard_2',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 } },
    },
  },
];
