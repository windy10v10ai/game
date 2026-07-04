import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 仙云法杖：NO_TARGET buff，1200 范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_hallowed_scepter',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, count: { gte: 1 }, ignoresMagicImmune: true },
    },
  },
];
