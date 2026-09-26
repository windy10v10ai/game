import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 刃甲 / 真刃甲（升级链）：激进（贴身有敌直接开）+ 保守（远处有敌且残血）两条 spec 实现 OR。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_blade_mail_2',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
    },
  },
  {
    itemName: 'item_blade_mail_2',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1800 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 95 } } },
    },
  },
  {
    itemName: 'item_blade_mail',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
    },
  },
  {
    itemName: 'item_blade_mail',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1800 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 95 } } },
    },
  },
];
