import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 黄金大核荣耀：NO_TARGET buff，900 范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_wasp_golden',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
    },
  },
];
