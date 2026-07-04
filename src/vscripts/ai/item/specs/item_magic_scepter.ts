import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 魔云法杖：NO_TARGET buff，1200 范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_magic_scepter',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, count: { gte: 1 }, ignoresMagicImmune: true },
    },
  },
];
