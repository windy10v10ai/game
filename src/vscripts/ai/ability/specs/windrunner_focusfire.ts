import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 风行者 - 集中火力：UNIT_TARGET / ENEMY。
 *
 * 冷却短，打架与推塔都放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'windrunner_focusfire',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'windrunner_focusfire',
    targetSide: TargetSide.EnemyBuilding,
    condition: {
      self: { friendlyCreepNearby: { count: { gte: 1 } } },
    },
  },
];
