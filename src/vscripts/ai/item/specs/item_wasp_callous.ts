import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 大核荣耀冷酷：NO_TARGET buff，900 范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_wasp_callous',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
    },
  },
];
