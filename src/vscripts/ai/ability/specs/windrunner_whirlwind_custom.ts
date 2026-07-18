import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 旋风：搜索范围内有敌方英雄时施放，仅有普通单位时留给怪群。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'windrunner_whirlwind_custom',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        rangeFromAbilityValue: 'search_radius_bonus',
        rangeFromAttackRange: true,
      },
    },
  },
  {
    abilityName: 'windrunner_whirlwind_custom',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 3 },
        rangeFromAbilityValue: 'search_radius_bonus',
        rangeFromAttackRange: true,
      },
    },
  },
];
