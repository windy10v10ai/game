import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/**
 * 陨星锤（升级链）：需要持续施法，只砸已被硬控且有队友在旁的敌方英雄，免得独自引导被打断；
 * 附近没有敌方英雄、有友方小兵吸引塔火力时拿来拆建筑，免得引导时自己挨塔打被迫走开；
 * 附近没有敌方英雄时也拿来清一大波兵。
 */
const CREEP_CONDITION: ItemSpec['condition'] = {
  target: { count: { gte: 3 } },
  self: { noEnemyHeroInRange: 1200, unitCondition: { manaPercent: { gte: 40 } } },
};
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_meteor_hammer',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { disabled: 'hard' } },
      self: { allyHeroInRange: 1200 },
    },
  },
  {
    itemName: 'item_meteor_hammer',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyBuilding,
    condition: { self: { noEnemyHeroInRange: 1500, friendlyCreepNearby: { count: { gte: 2 } } } },
  },
  {
    itemName: 'item_meteor_hammer',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyCreep,
    condition: CREEP_CONDITION,
  },
  {
    itemName: 'item_meteor_hammer_2',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { disabled: 'hard' } },
      self: { allyHeroInRange: 1200 },
    },
  },
  {
    itemName: 'item_meteor_hammer_2',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyBuilding,
    condition: { self: { noEnemyHeroInRange: 1500, friendlyCreepNearby: { count: { gte: 2 } } } },
  },
  {
    itemName: 'item_meteor_hammer_2',
    priority: ItemPriority.Damage,
    targetSide: TargetSide.EnemyCreep,
    condition: CREEP_CONDITION,
  },
];
