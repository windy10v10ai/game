import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 希瓦的守护 / 雅典娜守护（升级链）：NO_TARGET buff，范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_shivas_guard_2',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 } },
    },
  },
  {
    itemName: 'item_shivas_guard',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 } },
    },
  },
];
