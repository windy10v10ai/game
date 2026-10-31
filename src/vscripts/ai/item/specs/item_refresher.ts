import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/**
 * 刷新球 / 熔火核心 / 时间宝石（升级链）与肉山掉落的刷新碎片：范围内有敌人、蓝量充足、
 * 技能+物品总冷却压力大时使用；刷新碎片放在备用栏也能用。
 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_refresher',
    priority: ItemPriority.Refresh,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, ignoresMagicImmune: true },
      self: { unitCondition: { manaPercent: { gte: 30 } }, cooldownTotal: { gte: 90 } },
    },
  },
  {
    itemName: 'item_refresh_core',
    priority: ItemPriority.Refresh,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, ignoresMagicImmune: true },
      self: { unitCondition: { manaPercent: { gte: 30 } }, cooldownTotal: { gte: 70 } },
    },
  },
  {
    itemName: 'item_time_gem',
    priority: ItemPriority.Refresh,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, ignoresMagicImmune: true },
      self: { unitCondition: { manaPercent: { gte: 30 } }, cooldownTotal: { gte: 60 } },
    },
  },
  {
    itemName: 'item_refresher_shard',
    priority: ItemPriority.Refresh,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, ignoresMagicImmune: true },
      self: { unitCondition: { manaPercent: { gte: 30 } }, cooldownTotal: { gte: 90 } },
    },
    usableFromBackpack: true,
  },
];
