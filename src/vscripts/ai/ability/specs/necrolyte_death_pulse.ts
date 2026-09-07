import { AbilitySpec, TargetSide } from '../ability-spec';

/** 死亡脉冲：有效范围内有英雄时施放，只有兵群时也可清线。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'necrolyte_death_pulse',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'area_of_effect' },
    },
  },
  {
    abilityName: 'necrolyte_death_pulse',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { rangeFromAbilityValue: 'area_of_effect' },
    },
  },
];
