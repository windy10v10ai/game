import { AbilitySpec, TargetSide } from '../ability-spec';

/** 死亡搜寻：自身状态健康时对敌方英雄施放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'necrolyte_death_seeker',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { healthPercent: { gte: 50 } } },
    },
  },
];
