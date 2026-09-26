import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 赏金猎人 - 暗影步：NO_TARGET。
 *
 * 附近出现敌方英雄就隐身，逃跑时躲开，开战时摸过去打出眩晕；已隐身不重复开。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'bounty_hunter_wind_walk',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: {
        unitCondition: { noModifier: ['modifier_bounty_hunter_wind_walk'] },
      },
      target: { range: { lte: 1800 } },
    },
  },
];
