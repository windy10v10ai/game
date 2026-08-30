import { AbilitySpec, TargetSide } from '../ability-spec';

/** 石化凝视：有效范围内至少有两名敌方英雄时施放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'medusa_stone_gaze',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { count: { gte: 2 }, rangeFromAbilityValue: 'AbilityCastRange' },
    },
  },
];
