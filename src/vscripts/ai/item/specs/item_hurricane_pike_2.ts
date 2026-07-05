import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 黄金魔龙枪：实际攻击距离随天赋/装备浮动，不适合做检测半径，手动限定 600。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_hurricane_pike_2',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 } },
    },
  },
];
