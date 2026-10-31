import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 影魔 - 毁灭阴影（远）：NO_TARGET，在身前固定距离处爆开。
 *
 * 只在目标落进爆炸圆内时放，避免空放；打英雄之外也清兵。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'nevermore_shadowraze3',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        range: { lte: 950 },
        aheadCircle: { distanceValue: 'shadowraze_range', radiusValue: 'shadowraze_radius' },
      },
    },
  },
  {
    abilityName: 'nevermore_shadowraze3',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
        range: { lte: 950 },
        aheadCircle: { distanceValue: 'shadowraze_range', radiusValue: 'shadowraze_radius' },
      },
    },
  },
];
