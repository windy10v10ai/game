import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 引燃：UNIT_TARGET + AOE / ENEMY / HERO+BASIC。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'ogre_magi_ignite',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'ogre_magi_ignite',
    targetSide: TargetSide.EnemyCreep,
  },
];
