import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 熔火核心：仅在技能总冷却压力大（≥60秒）时使用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_refresh_core',
    targetSide: TargetSide.Self,
    condition: {
      self: { abilityCooldownTotal: { gte: 60 } },
    },
  },
];
