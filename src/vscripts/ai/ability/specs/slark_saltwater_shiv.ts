import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 海浪短刀：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * CD 制法球（CD 8-14s），常开消耗小，bot 抽到即开启自动施法。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'slark_saltwater_shiv',
    targetSide: TargetSide.Self,
    condition: { action: { autoCastOn: true } },
  },
];
