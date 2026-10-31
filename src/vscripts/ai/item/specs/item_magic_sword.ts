import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 魔渊剑：NO_TARGET buff，范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_magic_sword',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, ignoresMagicImmune: true },
    },
  },
];
