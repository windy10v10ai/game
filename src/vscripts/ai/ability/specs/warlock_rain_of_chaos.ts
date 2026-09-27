import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 术士 - 混乱之祭：POINT | AOE。
 *
 * 召唤的地狱火本身就是战力，打架与推塔都放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'warlock_rain_of_chaos',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'warlock_rain_of_chaos',
    targetSide: TargetSide.EnemyBuilding,
    condition: {
      self: { friendlyCreepNearby: { count: { gte: 1 } } },
    },
  },
];
