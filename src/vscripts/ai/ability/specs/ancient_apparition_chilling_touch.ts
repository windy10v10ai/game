import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 极寒之触：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * 每次攻击耗蓝法球，升到 2 级再开启，避免低级时持续耗蓝。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'ancient_apparition_chilling_touch',
    targetSide: TargetSide.Self,
    condition: {
      ability: { level: { gte: 2 } },
      action: { autoCastOn: true },
    },
  },
];
