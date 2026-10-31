import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 未精通的火焰爆轰：UNIT_TARGET / ENEMY / HERO+BASIC，神杖解锁。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'ogre_magi_unrefined_fireblast',
    targetSide: TargetSide.EnemyHero,
  },
];
