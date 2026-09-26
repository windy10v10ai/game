import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 昆卡 - 潮汐使者：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * 攻击附带效果，开启自动施法。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'kunkka_tidebringer',
    targetSide: TargetSide.Self,
    condition: {
      action: { autoCastOn: true },
    },
  },
];
