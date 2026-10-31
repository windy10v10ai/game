import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 雷神之怒：无目标大招，打到所有可见的敌方英雄。也在抽奖池中，任意英雄都可能抽到。
 *
 * 候选只来自 bot 的周边预搜，判据实际是「附近有人受伤」，抓不到全图残血。
 * 施法距离为 0，1800 必须显式写出，否则自动补范围会补成 0，把所有候选过滤掉。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'zuus_thundergods_wrath',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 80 } },
        range: { lte: 1800 },
      },
    },
  },
];
