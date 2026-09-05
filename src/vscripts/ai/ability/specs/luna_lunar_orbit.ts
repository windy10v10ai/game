import { AbilitySpec, TargetSide } from '../ability-spec';

/** 环月：受伤且有敌人进入飞刃碰撞范围时施放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'luna_lunar_orbit',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'rotating_glaives_hit_radius' },
      self: { unitCondition: { healthPercent: { lte: 95 } } },
    },
  },
];
