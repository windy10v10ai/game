import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 飓风长戟 / 黄金魔龙枪（升级链）：实际攻击距离随天赋/装备浮动，不适合做检测半径，改用手动限定的固定值。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_hurricane_pike_2',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 } },
    },
  },
  {
    itemName: 'item_hurricane_pike',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 } },
    },
  },
];
