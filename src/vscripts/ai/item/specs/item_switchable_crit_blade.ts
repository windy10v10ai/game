import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 归海一刀：切换刀势开关（Lua 参考版本未收录该物品，行为按开关类物品类推设计）。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_switchable_crit_blade',
    targetSide: TargetSide.Self,
    condition: {
      action: { toggleOn: true },
    },
  },
];
