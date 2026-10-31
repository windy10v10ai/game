import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 血魔 - 割裂：UNIT_TARGET / ENEMY。
 *
 * 见到就放，不重复割裂同一目标。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'bloodseeker_rupture',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { noModifier: ['modifier_bloodseeker_rupture'] },
      },
    },
  },
];
