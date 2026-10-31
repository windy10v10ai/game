import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 帕吉 - 肉盾：NO_TARGET。
 *
 * 交战中掉了血就开。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'pudge_flesh_heap',
    targetSide: TargetSide.Self,
    condition: {
      self: {
        unitCondition: { healthPercent: { lte: 90 } },
        enemyHeroInRange: 900,
      },
    },
  },
];
