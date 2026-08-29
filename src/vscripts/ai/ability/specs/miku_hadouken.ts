import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 蔬菜汁Popipo：UNIT_TARGET + POINT / ENEMY / HERO+BASIC。
 *
 * 同时具备单位目标与点目标，dispatcher 优先按单位目标派发，必定命中。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'miku_hadouken',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'miku_hadouken',
    targetSide: TargetSide.EnemyCreep,
  },
];
