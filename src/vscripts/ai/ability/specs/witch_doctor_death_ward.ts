import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 巫医 - 死亡守卫：POINT | CHANNELLED。
 *
 * 引导会被打断、目标会走出守卫射程，要有队友在且目标跑不动才放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'witch_doctor_death_ward',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { allyHeroInRange: 1200 },
      target: { unitCondition: { disabled: 'movement' } },
    },
  },
];
