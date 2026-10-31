import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 不朽之心 / 生命之心（升级链）：治疗类，附近有敌人且残血才用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_undying_heart',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 50 } } },
    },
  },
  {
    itemName: 'item_withered_spring',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 50 } } },
    },
  },
];
