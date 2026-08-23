import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 奶飞天：UNIT_TARGET / FRIENDLY / HERO+BASIC，Scepter 解锁。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'omniknight_angelic_flight',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 85 } },
      },
    },
  },
];
