import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 沙王 - 地震：NO_TARGET，施法前需要引导。
 *
 * 引导会被打断，只在身边敌人被硬控时放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sandking_epicenter',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        rangeFromAbilityValue: 'epicenter_radius_base',
        unitCondition: { disabled: 'hard' },
      },
    },
  },
];
