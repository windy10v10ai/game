import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 死亡一指：单体高伤大招，UNIT_TARGET / ENEMY / HERO。
 *
 * Lottery 池 T2 主动技能，可被任意英雄抽到。
 * 与 Lion 自带 finger 条件保持一致：避开满血英雄（lte 95）。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lion_finger_of_death',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 95 } },
      },
    },
  },
];
