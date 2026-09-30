import { TargetSide } from '../../ability/ability-spec';
import { ItemPriority, ItemSpec } from '../item-spec';

/** 肉山的战旗（肉山掉落）：推塔时插在塔前给兵线加成，团战时插在敌人堆里；放在备用栏也能用。 */
export const SPECS: ItemSpec[] = [
  {
    itemName: 'item_roshans_banner',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyBuilding,
    condition: { self: { friendlyCreepNearby: { count: { gte: 3 } } } },
    usableFromBackpack: true,
  },
  {
    itemName: 'item_roshans_banner',
    priority: ItemPriority.Buff,
    targetSide: TargetSide.EnemyHero,
    condition: { target: { count: { gte: 2 } }, self: { allyHeroInRange: 1200 } },
    usableFromBackpack: true,
  },
];
