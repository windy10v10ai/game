import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 风行者 - 风行：NO_TARGET，闪避普攻。
 *
 * 附近有敌方英雄，或靠近敌方建筑会挨塔打时开。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'windrunner_windrun',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 } },
    },
  },
  {
    abilityName: 'windrunner_windrun',
    targetSide: TargetSide.EnemyBuilding,
    condition: {
      target: { range: { lte: 800 } },
    },
  },
];
