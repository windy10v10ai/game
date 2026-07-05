import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/**
 * 刷新球 / 熔火核心 / 时间宝石（升级链）：900 范围内有敌人、蓝量充足（≥30%）、
 * 技能总冷却压力大（≥60秒）时使用。
 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_refresher',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { manaPercent: { gte: 30 } }, abilityCooldownTotal: { gte: 60 } },
    },
  },
  {
    itemName: 'item_refresh_core',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { manaPercent: { gte: 30 } }, abilityCooldownTotal: { gte: 60 } },
    },
  },
  {
    itemName: 'item_time_gem',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { manaPercent: { gte: 30 } }, abilityCooldownTotal: { gte: 60 } },
    },
  },
];
