import { AbilitySpec, TargetSide } from '../ability-spec';

/** 机械行军：AoE 半径远大于 cast range，放宽搜索到 900 并投影到 cast range 边缘。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'tinker_march_of_the_machines',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        range: { lte: 900 },
        castMode: 'projectedOnCastRange',
      },
    },
  },
  {
    abilityName: 'tinker_march_of_the_machines',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
        range: { lte: 900 },
        castMode: 'projectedOnCastRange',
      },
      ability: { level: { gte: 1 } },
    },
  },
];
