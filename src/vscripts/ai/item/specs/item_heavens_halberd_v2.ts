import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 天堂之戟 / 无锋战戟（升级链）：缴械，身边敌人多时才值得交。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_heavens_halberd_v2',
    priority: ItemPriority.Control,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, count: { gte: 2 }, ignoresMagicImmune: true },
    },
  },
  {
    itemName: 'item_heavens_halberd',
    priority: ItemPriority.Control,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, count: { gte: 2 }, ignoresMagicImmune: true },
    },
  },
];
