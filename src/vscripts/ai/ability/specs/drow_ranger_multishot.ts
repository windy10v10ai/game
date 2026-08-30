import { AbilitySpec, TargetSide } from '../ability-spec';

/** 数箭齐发：攻击范围内有英雄时施放，只有小兵时留给兵群。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'drow_ranger_multishot',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAttackRange: true, attackRangeOffset: 400 },
    },
  },
  {
    abilityName: 'drow_ranger_multishot',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { gte: 3 }, rangeFromAttackRange: true, attackRangeOffset: 400 },
    },
  },
];
