import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 亚巴顿 - 回光返照：NO_TARGET。
 *
 * 比原版低血自动触发更早开，后期血量高时自动触发偏晚；要求附近有敌人，避免被小兵野怪打低时白交。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'abaddon_borrowed_time',
    targetSide: TargetSide.Self,
    condition: {
      self: {
        unitCondition: { healthPercent: { lte: 40 } },
        enemyHeroInRange: 1200,
      },
    },
  },
];
