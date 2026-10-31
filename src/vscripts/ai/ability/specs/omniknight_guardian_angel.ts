import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 守护天使：NO_TARGET，团队物理免疫，作用对象是施法者周围，不是某个被选中的目标。
 *
 * 用敌方英雄出现在附近来触发，而不是看友方血量。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'omniknight_guardian_angel',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 }, count: { gte: 2 } },
    },
  },
];
