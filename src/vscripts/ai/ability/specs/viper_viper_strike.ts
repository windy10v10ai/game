import { AbilitySpec, TargetSide } from '../ability-spec';

/** 蝮蛇突袭：目标未受同名效果影响时施放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'viper_viper_strike',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { unitCondition: { noModifier: ['modifier_viper_viper_strike'] } },
    },
  },
];
