import { AbilitySpec, TargetSide } from '../ability-spec';

/** 狂风：有敌方英雄进入施法范围即释放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'drow_ranger_wave_of_silence',
    targetSide: TargetSide.EnemyHero,
  },
];
