import { AbilitySpec, TargetSide } from '../ability-spec';

/** 部署炮塔：炮塔导弹作用半径远大于 cast range，放宽搜索到 1800 并投影到 cast range 边缘。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'tinker_deploy_turrets',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        range: { lte: 1800 },
        castMode: 'projectedOnCastRange',
      },
    },
  },
];
