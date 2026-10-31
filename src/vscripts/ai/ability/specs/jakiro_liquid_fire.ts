import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 杰奇洛 - 液态火：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * 攻击附带效果，开启自动施法。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'jakiro_liquid_fire',
    targetSide: TargetSide.Self,
    condition: {
      action: { autoCastOn: true },
    },
  },
];
