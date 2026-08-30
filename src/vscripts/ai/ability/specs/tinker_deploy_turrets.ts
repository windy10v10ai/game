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
  {
    abilityName: 'tinker_deploy_turrets',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { gte: 2 } },
      // 1 级导弹伤害 80、蓝耗 100，清兵不划算
      ability: { level: { gte: 2 } },
      // 对小兵施法默认要求 900 内无敌方英雄，这里用 0 关掉：炮台放下后持续输出，交战中同样有价值
      self: { noEnemyHeroInRange: 0 },
    },
  },
];
