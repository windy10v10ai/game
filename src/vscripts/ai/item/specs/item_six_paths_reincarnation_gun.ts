import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** Six Paths Reincarnation Gun: use the no-target combat buff near enemy heroes. */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_six_paths_reincarnation_gun',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, ignoresMagicImmune: true },
    },
  },
];
