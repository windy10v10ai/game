import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 奶酪（肉山掉落）：快被打死时吃；放在备用栏也能用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_cheese',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.Self,
    condition: { self: { unitCondition: { healthPercent: { lte: 25 } } } },
    usableFromBackpack: true,
  },
];
