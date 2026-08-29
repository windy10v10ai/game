import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 鬼影重重：NO_TARGET，在每个敌方英雄身边生成幻象。
 *
 * KV 无施法距离字段，1800 等于 bot 的周边预搜半径。阈值取 3 是为了让它落在真正的团战上。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'spectre_haunt',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1800 }, count: { gte: 3 } },
    },
  },
];
