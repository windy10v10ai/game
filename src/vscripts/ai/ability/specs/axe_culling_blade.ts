import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 淘汰之刃：UNIT_TARGET / ENEMY / HERO，血量低于阈值时直接斩杀。
 *
 * Lottery 池 T3 主动技能。
 * 仅对低血量敌方英雄使用（残血斩杀），避免浪费在满血目标上。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'axe_culling_blade',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 25 } },
      },
    },
  },
];
