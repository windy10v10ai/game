import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 肉山战旗：拾取物，周围友方小兵数量足够时对小兵位置放置。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_roshans_banner',
    targetSide: TargetSide.FriendlyCreep,
    condition: {
      self: { friendlyCreepNearby: { count: { gte: 3 } } },
    },
    usableFromBackpack: true,
  },
];
