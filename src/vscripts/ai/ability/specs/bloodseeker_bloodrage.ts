import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 血魔 - 血怒：NO_TARGET 自身增益。
 *
 * 打架与推塔都开。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'bloodseeker_bloodrage',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 } },
    },
  },
  {
    abilityName: 'bloodseeker_bloodrage',
    targetSide: TargetSide.EnemyBuilding,
    condition: {
      self: { friendlyCreepNearby: { count: { gte: 1 } } },
      target: { range: { lte: 800 } },
    },
  },
];
