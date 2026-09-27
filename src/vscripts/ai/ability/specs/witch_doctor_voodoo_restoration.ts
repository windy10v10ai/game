import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 巫医 - 巫毒回复术：NO_TARGET | TOGGLE，开着持续耗蓝。
 *
 * 范围内有残血的自己或队友时开，没有就关。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'witch_doctor_voodoo_restoration',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        rangeFromAbilityValue: 'radius',
        unitCondition: { healthPercent: { lte: 60 } },
      },
      action: { toggleByTarget: true },
    },
  },
];
