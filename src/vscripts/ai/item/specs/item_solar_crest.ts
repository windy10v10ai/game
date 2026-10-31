import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/**
 * 炎阳纹章：交战中给掉血的队友加护甲，血线比微光披风放得早；
 * 队友英雄或友方小兵挨塔打时也给，帮着推塔。
 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_solar_crest',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: {
          healthPercent: { lte: 60 },
          noModifier: ['modifier_item_solar_crest_armor_addition'],
        },
        excludeSelf: true,
      },
      self: { enemyHeroInRange: 1200 },
    },
  },
  {
    itemName: 'item_solar_crest',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: { noModifier: ['modifier_item_solar_crest_armor_addition'] },
        excludeSelf: true,
        attackedByTower: true,
      },
    },
  },
  {
    itemName: 'item_solar_crest',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.FriendlyCreep,
    condition: {
      target: {
        unitCondition: { noModifier: ['modifier_item_solar_crest_armor_addition'] },
        attackedByTower: true,
      },
    },
  },
];
