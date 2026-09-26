import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 帕吉 - 腐烂：NO_TARGET | TOGGLE，开着会持续掉自己的血。
 *
 * 范围内有敌方英雄时开，没有就关。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'pudge_rot',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'rot_radius' },
      action: { toggleByTarget: true },
    },
  },
];
