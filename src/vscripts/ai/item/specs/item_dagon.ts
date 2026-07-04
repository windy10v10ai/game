import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 达贡（1~5 级共用同一条无条件伤害逻辑，合并一个文件维护）。 */
export const SPECS: ItemSpec[] = [
  { itemName: 'item_dagon', targetSide: TargetSide.EnemyHero },
  { itemName: 'item_dagon_2', targetSide: TargetSide.EnemyHero },
  { itemName: 'item_dagon_3', targetSide: TargetSide.EnemyHero },
  { itemName: 'item_dagon_4', targetSide: TargetSide.EnemyHero },
  { itemName: 'item_dagon_5', targetSide: TargetSide.EnemyHero },
];
