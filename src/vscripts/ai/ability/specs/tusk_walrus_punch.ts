import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 海象神拳：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * CD 制法球（触发后才耗蓝），常开无害，bot 抽到即开启自动施法。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'tusk_walrus_punch',
    targetSide: TargetSide.Self,
    condition: { action: { autoCastOn: true } },
  },
];
