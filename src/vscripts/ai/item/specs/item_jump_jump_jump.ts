import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 闪烁匕首升级链上的各件，撤退与赶路时的闪烁也按这份名单找。 */
export const BLINK_ITEM_NAMES = [
  'item_blink',
  'item_arcane_blink',
  'item_arcane_blink_2',
  'item_overwhelming_blink',
  'item_overwhelming_blink_2',
  'item_swift_blink',
  'item_swift_blink_2',
  'item_jump_jump_jump',
];

/** 闪烁切入：跳到敌人身边与跳入类技能同一门槛，濒死时不往里跳。 */
export const SPECS: ItemSpec[] = BLINK_ITEM_NAMES.map((itemName) => ({
  itemName,
  targetSide: TargetSide.EnemyHero,
  condition: {
    self: { canEngage: true, unitCondition: { healthPercent: { gte: 20 } } },
  },
}));
