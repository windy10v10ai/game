import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 狙击手 - 暗杀：UNIT_TARGET / ENEMY。
 *
 * 冷却短，当远程消耗与收割；施法前摇长，敌人在普攻距离内时普攻更划算，只打够不着的。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sniper_assassinate',
    targetSide: TargetSide.EnemyHero,
    condition: { target: { outOfAttackRange: true } },
  },
];
