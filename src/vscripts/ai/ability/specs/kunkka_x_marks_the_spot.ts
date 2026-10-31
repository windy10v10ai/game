import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * X 标记：UNIT_TARGET / BOTH / HERO，此处只用于敌方。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'kunkka_x_marks_the_spot',
    targetSide: TargetSide.EnemyHero,
  },
];
