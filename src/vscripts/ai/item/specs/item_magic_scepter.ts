import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 魔云法杖 / 仙云法杖 / 魔龙狂舞（升级链）：NO_TARGET buff，范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_magic_scepter',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: { target: { range: { lte: 1200 } } },
  },
  {
    itemName: 'item_hallowed_scepter',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: { target: { range: { lte: 1200 } } },
  },
  {
    itemName: 'item_magic_crit_blade',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: { target: { range: { lte: 1200 } } },
  },
];
