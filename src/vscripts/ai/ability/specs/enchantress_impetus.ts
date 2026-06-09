import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 推进：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * 高蓝耗法球（40-60/攻击），升到 2 级再开启，避免低级时持续耗蓝。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'enchantress_impetus',
    targetSide: TargetSide.Self,
    condition: {
      ability: { level: { gte: 2 } },
      action: { autoCastOn: true },
    },
  },
];
