import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 兽化盾：激进（600 内敌人直接开）+ 保守（900 内敌人且残血）两条 spec 实现 OR。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_beast_shield',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 }, count: { gte: 1 }, ignoresMagicImmune: true },
    },
  },
  {
    itemName: 'item_beast_shield',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, count: { gte: 1 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 80 } } },
    },
  },
];
