import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 熔火核心：600 范围内有敌人，且技能总冷却压力大（≥60秒）时使用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_refresh_core',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 }, count: { gte: 1 }, ignoresMagicImmune: true },
      self: { abilityCooldownTotal: { gte: 60 } },
    },
  },
];
