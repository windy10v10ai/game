import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 天怒法师 - 震荡光弹：NO_TARGET，自动打最近的敌方英雄。
 *
 * 范围内没有英雄时会打到小兵，所以要求范围内有敌方英雄。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'skywrath_mage_concussive_shot',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'launch_radius' },
    },
  },
];
