import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 主宰 - 剑刃风暴：NO_TARGET，期间魔免。
 *
 * 敌人贴身时输出，残血时靠魔免逃跑。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'juggernaut_blade_fury',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'blade_fury_radius' },
    },
  },
  {
    abilityName: 'juggernaut_blade_fury',
    targetSide: TargetSide.Self,
    condition: {
      self: {
        unitCondition: { healthPercent: { lte: 30 } },
        enemyHeroInRange: 1200,
      },
    },
  },
];
