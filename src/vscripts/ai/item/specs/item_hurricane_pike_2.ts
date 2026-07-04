import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 黄金魔龙枪：Lua 未用 GetFullCastRange，而是手动限定 600，这里保留同样的范围限制。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_hurricane_pike_2',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 } },
    },
  },
];
