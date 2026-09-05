import { AbilitySpec, TargetSide } from '../ability-spec';

/** 极恶俯冲：持有神杖且自身状态健康时对敌方英雄施放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'viper_nose_dive',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { healthPercent: { gte: 50 }, hasScepter: true } },
    },
  },
];
