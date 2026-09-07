import { AbilitySpec, TargetSide } from '../ability-spec';

/** 冰川：敌人进入攻击与技能可衔接的范围时施放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'drow_ranger_glacier',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAttackRange: true },
    },
  },
];
