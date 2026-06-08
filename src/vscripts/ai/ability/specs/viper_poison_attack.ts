import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 毒性攻击：UNIT_TARGET | AUTOCAST | ATTACK。
 *
 * 每次攻击耗蓝法球，升到 2 级（跳过最低级、蓝耗占比高的 1 级）再开启，避免低级时持续耗蓝。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'viper_poison_attack',
    targetSide: TargetSide.Self,
    condition: {
      ability: { level: { gte: 2 } },
      action: { autoCastOn: true },
    },
  },
];
