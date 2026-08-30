import { AbilitySpec, TargetSide } from '../ability-spec';

/** 死神镰刀：目标生命较低时施放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'necrolyte_reapers_scythe',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { healthPercent: { lte: 50 } } },
    },
  },
];
