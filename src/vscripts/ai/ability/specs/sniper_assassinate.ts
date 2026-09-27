import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 狙击手 - 暗杀：UNIT_TARGET / ENEMY。
 *
 * 冷却短，当远程消耗与收割，见到就放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sniper_assassinate',
    targetSide: TargetSide.EnemyHero,
  },
];
