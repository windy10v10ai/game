import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 撒旦之邪力 / 真红撒旦（升级链）：吸血类，附近有敌人且残血才用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_satanic_2',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 60 } } },
    },
  },
  {
    itemName: 'item_satanic',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 60 } } },
    },
  },
];
