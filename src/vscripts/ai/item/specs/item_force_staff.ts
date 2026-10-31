import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/**
 * 原力法杖 / 飓风长戟（升级链）：推动方向取目标朝向，只推正背对敌人逃跑的残血队友。
 * 推自己由英雄移动逻辑在撤退与赶路时处理，那里知道目的地。
 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_force_staff',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 40 } }, excludeSelf: true, fleeing: 700 },
    },
  },
  {
    itemName: 'item_force_staff_2',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 40 } }, excludeSelf: true, fleeing: 700 },
    },
  },
  {
    itemName: 'item_force_staff_3',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 40 } }, excludeSelf: true, fleeing: 700 },
    },
  },
  {
    itemName: 'item_hurricane_pike',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 40 } }, excludeSelf: true, fleeing: 700 },
    },
  },
  {
    itemName: 'item_hurricane_pike_2',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 40 } }, excludeSelf: true, fleeing: 700 },
    },
  },
];
