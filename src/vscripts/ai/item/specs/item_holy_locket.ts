import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 圣洁吊坠 / 苍洋魔珠（升级链）：对友方残血英雄治疗。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_holy_locket',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: { target: { unitCondition: { healthPercent: { lte: 40 } } } },
  },
  {
    itemName: 'item_orb_of_the_brine',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: { target: { unitCondition: { healthPercent: { lte: 40 } } } },
  },
];
