import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 无锋战戟：保留 Lua 2+ 敌人才放的门槛。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_heavens_halberd_v2',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, count: { gte: 2 }, ignoresMagicImmune: true },
    },
  },
];
