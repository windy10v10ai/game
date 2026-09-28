import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 赤红甲：敌方英雄贴近、身边有队友时开群体格挡。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_crimson_guard',
    priority: ItemPriority.Survival,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 }, ignoresMagicImmune: true },
      self: { allyHeroInRange: 1200 },
    },
  },
];
