import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 雷神之锤 / 神器·神雷锤（升级链）：交战中给自己或队友套静电护盾。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_mjollnir',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { noModifier: ['modifier_item_mjollnir_static'] } },
      self: { enemyHeroInRange: 900 },
    },
  },
  {
    itemName: 'item_mjollnir_2',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { unitCondition: { noModifier: ['modifier_item_mjollnir_static'] } },
      self: { enemyHeroInRange: 900 },
    },
  },
];
