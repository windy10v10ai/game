import { AbilitySpec, TargetSide } from '../ability-spec';

export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'disruptor_static_storm_awakened',
    targetSide: TargetSide.EnemyHero,
    condition: { target: { count: { gte: 2 }, rangeFromAbilityValue: 'radius' } },
  },
  {
    abilityName: 'disruptor_static_storm_awakened',
    targetSide: TargetSide.EnemyHero,
    condition: { target: { count: { gte: 1 }, rangeFromAbilityValue: 'radius' } },
  },
];
