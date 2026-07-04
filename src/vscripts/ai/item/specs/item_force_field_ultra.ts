import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 天地同寿甲：激进（900 内敌人直接开）+ 保守（1800 内敌人且残血）两条 spec 实现 OR。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_force_field_ultra',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
    },
  },
  {
    itemName: 'item_force_field_ultra',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1800 }, count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 95 } } },
    },
  },
];
