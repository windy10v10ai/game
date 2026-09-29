import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 梅肯斯姆 / 卫士胫甲（升级链）：交战中身边有队友掉血时群体回复。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_mekansm',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { range: { lte: 1200 }, unitCondition: { healthPercent: { lte: 60 } } },
      self: { enemyHeroInRange: 1200 },
    },
  },
  {
    itemName: 'item_guardian_greaves',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { range: { lte: 1200 }, unitCondition: { healthPercent: { lte: 60 } } },
      self: { enemyHeroInRange: 1200 },
    },
  },
  {
    itemName: 'item_guardian_greaves_artifact',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: { range: { lte: 1200 }, unitCondition: { healthPercent: { lte: 60 } } },
      self: { enemyHeroInRange: 1200 },
    },
  },
];
