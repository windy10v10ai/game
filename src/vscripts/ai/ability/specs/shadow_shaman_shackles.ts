import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 暗影萨满 - 枷锁及觉醒替换：对敌方英雄施放控制。
 *
 * 跳过已被控制的目标，避免浪费持续控制时间。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'shadow_shaman_shackles',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { notActionable: true },
      },
    },
  },
  {
    abilityName: 'special_bonus_unique_shadow_shaman_shackles_awaken',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { notActionable: true },
      },
    },
  },
];
