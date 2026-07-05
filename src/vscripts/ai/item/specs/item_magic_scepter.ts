import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 魔云法杖 / 仙云法杖 / 魔龙狂舞（升级链）：NO_TARGET buff，1200 范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_magic_scepter',
    targetSide: TargetSide.EnemyHero,
    condition: { target: { range: { lte: 1200 }, count: { gte: 1 } } },
  },
  {
    itemName: 'item_hallowed_scepter',
    targetSide: TargetSide.EnemyHero,
    condition: { target: { range: { lte: 1200 }, count: { gte: 1 } } },
  },
  {
    itemName: 'item_magic_crit_blade',
    targetSide: TargetSide.EnemyHero,
    condition: { target: { range: { lte: 1200 }, count: { gte: 1 } } },
  },
];
