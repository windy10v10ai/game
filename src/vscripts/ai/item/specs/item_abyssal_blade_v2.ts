import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 深渊之刃 / 一闪（升级链）：目标已被控制也照放，让控制重叠，避免对单人玩家无缝连控。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_abyssal_blade_v2',
    priority: ItemPriority.Control,
    targetSide: TargetSide.EnemyHero,
    control: true,
    condition: {
      self: { unitCondition: { healthPercent: { gte: 20 } } },
    },
  },
  {
    itemName: 'item_abyssal_blade',
    priority: ItemPriority.Control,
    targetSide: TargetSide.EnemyHero,
    control: true,
    condition: {
      self: { unitCondition: { healthPercent: { gte: 20 } } },
    },
  },
];
