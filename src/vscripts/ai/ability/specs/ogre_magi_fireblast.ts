import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 火焰爆轰：UNIT_TARGET / ENEMY / HERO+BASIC。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'ogre_magi_fireblast',
    targetSide: TargetSide.EnemyHero,
  },
];
