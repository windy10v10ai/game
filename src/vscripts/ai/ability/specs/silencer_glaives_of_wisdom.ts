import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 智慧之刃：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * 每次攻击耗蓝法球，升到 2 级再开启，避免低级时持续耗蓝。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'silencer_glaives_of_wisdom',
    targetSide: TargetSide.Self,
    condition: {
      ability: { level: { gte: 2 } },
      action: { autoCastOn: true },
    },
  },
];
