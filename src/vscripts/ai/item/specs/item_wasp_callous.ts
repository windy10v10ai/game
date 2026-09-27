import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 大核荣耀冷酷 / 暴虐 / 黄金大核荣耀（升级链）：NO_TARGET buff，范围内有敌人即用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_wasp_callous',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: { target: { range: { lte: 1200 }, ignoresMagicImmune: true } },
  },
  {
    itemName: 'item_wasp_despotic',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: { target: { range: { lte: 1200 }, ignoresMagicImmune: true } },
  },
  {
    itemName: 'item_wasp_golden',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: { target: { range: { lte: 1200 }, ignoresMagicImmune: true } },
  },
];
