import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 纯洁之锤：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * 0 蓝法球，常开无害，bot 抽到即开启自动施法。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'omniknight_hammer_of_purity',
    targetSide: TargetSide.Self,
    condition: { action: { autoCastOn: true } },
  },
];
