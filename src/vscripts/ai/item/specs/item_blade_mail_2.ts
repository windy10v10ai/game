import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 真刃甲：激进（贴身有敌直接开）+ 保守（远处有敌且残血）两条 spec 实现 OR。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_blade_mail_2',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
    },
  },
  {
    itemName: 'item_blade_mail_2',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1800 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 95 } } },
    },
  },
];
