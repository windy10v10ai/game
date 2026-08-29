import { AbilitySpec, TargetSide } from '../ability-spec';

/** 幽鬼之刃：POINT + UNIT_TARGET / ENEMY / HERO。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'spectre_spectral_dagger',
    targetSide: TargetSide.EnemyHero,
    condition: {
      ability: { level: { gte: 3 } },
    },
  },
];
