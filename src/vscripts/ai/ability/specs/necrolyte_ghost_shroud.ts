import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 死灵法师 - 幽魂护罩：NO_TARGET。
 *
 * 敌人进入减速范围就开。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'necrolyte_ghost_shroud',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'slow_aoe' },
    },
  },
];
