import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 影刃 / 白银之锋 / 无敌之刃（升级链）：决定上去打时隐身接近，残血被追时隐身脱身。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_invis_sword',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1500 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { gte: 50 } }, canEngage: true },
    },
  },
  {
    itemName: 'item_invis_sword',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 30 } } },
    },
  },
  {
    itemName: 'item_silver_edge',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1500 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { gte: 50 } }, canEngage: true },
    },
  },
  {
    itemName: 'item_silver_edge',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 30 } } },
    },
  },
  {
    itemName: 'item_silver_edge_2',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1500 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { gte: 50 } }, canEngage: true },
    },
  },
  {
    itemName: 'item_silver_edge_2',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 30 } } },
    },
  },
];
