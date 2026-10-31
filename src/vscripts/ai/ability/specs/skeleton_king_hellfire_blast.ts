import { AbilitySpec, TargetSide } from '../ability-spec';

/** 冥火爆击：有敌方英雄进入施法范围即释放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'skeleton_king_hellfire_blast',
    targetSide: TargetSide.EnemyHero,
  },
];
