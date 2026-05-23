import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 法力吸取：UNIT_TARGET / ENEMY / HERO+CREEP。
 *
 * 对英雄无限制；对小兵在自身蓝量不足时吸蓝，要求目标有足够蓝量值得吸。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lion_mana_drain',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: {
        noEnemyHeroInRange: 300,
        unitCondition: { manaPercent: { lte: 40 } },
      },
      target: {
        unitCondition: { manaPercent: { gte: 30 } },
      },
    },
  },
  {
    abilityName: 'lion_mana_drain',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      self: {
        unitCondition: { manaPercent: { lte: 60 } },
      },
      target: {
        unitCondition: { manaPercent: { gte: 50 } },
      },
      ability: { level: { gte: 1 } },
    },
  },
];
