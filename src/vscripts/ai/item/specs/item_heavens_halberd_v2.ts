import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 无锋战戟：AoE 命中人数越多性价比越高，要求至少 2 个敌人才放。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_heavens_halberd_v2',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, count: { gte: 2 }, ignoresMagicImmune: true },
    },
  },
];
