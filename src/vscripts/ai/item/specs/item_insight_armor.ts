import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 洞察护甲：激进（贴身有敌直接开）+ 保守（远处有敌且残血）两条 spec 实现 OR。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_insight_armor',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
    },
  },
  {
    itemName: 'item_insight_armor',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1800 }, ignoresMagicImmune: true },
      self: { unitCondition: { healthPercent: { lte: 90 } } },
    },
  },
];
