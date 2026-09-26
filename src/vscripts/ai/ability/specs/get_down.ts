import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * GET DOWN!!!：NO_TARGET + CHANNELLED，Scepter 解锁的引导重击。
 *
 * 引导很长，身边一段时间没有敌方英雄就停下；敌人只是短暂走开时继续跳，免得技能在冷却时敌人又回来。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'get_down',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 }, count: { gte: 2 } },
    },
    stopChannel: { noEnemyHeroInRange: 1200, graceSeconds: 5 },
  },
];
