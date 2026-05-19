import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 变羊：UNIT_TARGET / ENEMY / HERO。
 *
 * 对任意可见敌方英雄施放，不加额外限制。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lion_voodoo',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { notActionable: true },
      },
    },
  },
];
