import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 幽灵船：DIRECTIONAL + POINT / ENEMY / HERO+BASIC。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'kunkka_ghostship',
    targetSide: TargetSide.EnemyHero,
  },
];
