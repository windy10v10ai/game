import { TargetSide } from '../../ability/ability-spec';
import { ItemSpec } from '../item-spec';

/** 灵魂之戒：交战中缺蓝且血量还扛得住时换蓝。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_soul_ring',
    targetSide: TargetSide.Self,
    condition: {
      self: {
        unitCondition: { manaPercent: { lte: 40 }, healthPercent: { gte: 50 } },
        enemyHeroInRange: 1200,
      },
    },
  },
];
