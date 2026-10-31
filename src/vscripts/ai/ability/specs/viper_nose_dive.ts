import { AbilitySpec, TargetSide } from '../ability-spec';

/** 极恶俯冲：持有神杖时俯冲到敌人身边，只在决定上去打时用。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'viper_nose_dive',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { hasScepter: true }, stance: 'fight' },
    },
  },
];
