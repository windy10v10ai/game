import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/**
 * 刷新球 / 熔火核心 / 时间宝石（升级链）：900 范围内有敌人、蓝量充足（≥30%）、
 * 技能+物品总冷却压力大（≥90秒）时使用。
 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_refresher',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { manaPercent: { gte: 30 } }, cooldownTotal: { gte: 90 } },
    },
  },
  {
    itemName: 'item_refresh_core',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { manaPercent: { gte: 30 } }, cooldownTotal: { gte: 90 } },
    },
  },
  {
    itemName: 'item_time_gem',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { manaPercent: { gte: 30 } }, cooldownTotal: { gte: 90 } },
    },
  },
];
