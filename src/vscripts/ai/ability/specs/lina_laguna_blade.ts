import { AbilitySpec, TargetSide } from '../ability-spec';

/** 神灭斩：UNIT_TARGET / ENEMY / HERO+BASIC。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lina_laguna_blade',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 80 } },
      },
    },
  },
];
