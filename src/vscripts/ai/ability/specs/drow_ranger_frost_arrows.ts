import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 霜冻之箭：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * 项目里每箭耗蓝 9-13（AbilityValues 嵌套 manacost），升到 2 级再开启，避免低级时持续耗蓝。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'drow_ranger_frost_arrows',
    targetSide: TargetSide.Self,
    condition: {
      ability: { level: { gte: 2 } },
      action: { autoCastOn: true },
    },
  },
];
