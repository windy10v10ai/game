import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 雷云：神杖解锁的范围技能，在指定位置留下持续劈敌的云。
 *
 * 施法距离为 0，搜索上限必须显式给出。1800 等于 bot 的周边预搜半径，
 * 语义即「候选列表里有敌方英雄就放」。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'zuus_cloud',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1800 } },
      self: { unitCondition: { hasScepter: true } },
    },
  },
];
