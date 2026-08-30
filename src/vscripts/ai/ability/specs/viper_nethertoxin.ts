import { AbilitySpec, TargetSide } from '../ability-spec';

/** 幽冥剧毒：优先覆盖未受毒池影响的英雄，安全时也可清线。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'viper_nethertoxin',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { noModifier: 'modifier_viper_nethertoxin' } },
    },
  },
  {
    abilityName: 'viper_nethertoxin',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { unitCondition: { noModifier: 'modifier_viper_nethertoxin' } },
    },
  },
];
