import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 赏金猎人 - 忍术：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * 攻击附带效果，开启自动施法。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'bounty_hunter_jinada',
    targetSide: TargetSide.Self,
    condition: {
      action: { autoCastOn: true },
    },
  },
];
