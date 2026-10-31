import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 影魔 - 灵魂盛宴：NO_TARGET 自身增益。
 *
 * 打架与推塔都开。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'nevermore_frenzy',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 } },
    },
  },
  {
    abilityName: 'nevermore_frenzy',
    targetSide: TargetSide.EnemyBuilding,
    condition: {
      self: { friendlyCreepNearby: { count: { gte: 1 } } },
      target: { range: { lte: 800 } },
    },
  },
];
