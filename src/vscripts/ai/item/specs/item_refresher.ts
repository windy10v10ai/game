import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 刷新球：仅在技能总冷却压力大（≥60秒）时使用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_refresher',
    targetSide: TargetSide.Self,
    condition: {
      self: { abilityCooldownTotal: { gte: 60 } },
    },
  },
];
