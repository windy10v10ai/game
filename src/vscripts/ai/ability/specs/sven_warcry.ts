import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 斯温 - 战吼：NO_TARGET，给自己和附近队友加护甲与护盾。
 *
 * 打架与推塔都开。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sven_warcry',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 } },
    },
  },
  {
    abilityName: 'sven_warcry',
    targetSide: TargetSide.EnemyBuilding,
    condition: {
      self: { friendlyCreepNearby: { count: { gte: 1 } } },
      target: { range: { lte: 800 } },
    },
  },
];
