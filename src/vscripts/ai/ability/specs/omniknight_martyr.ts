import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 驱逐：UNIT_TARGET / FRIENDLY / HERO。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'omniknight_martyr',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 60 } },
      },
    },
  },
];
