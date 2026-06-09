import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 分裂箭：NO_TARGET | TOGGLE。开启后攻击分裂打多目标，但降低单体伤害。
 *
 * 900 内敌方英雄 ≥2 / 小兵 ≥3 时开启群战/清线，≤1 时关闭。count 区间留缓冲带避免边界横跳。
 * 对小兵 dispatcher 默认套 level≥3 门槛（为主动施法设计），开关只看数量，故显式写 level.gte:1 覆盖掉。
 * 自 hero-medusa.ts 迁移而来。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'medusa_split_shot',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { count: { gte: 2 }, range: { lte: 900 } },
      ability: { level: { gte: 2 } },
      action: { toggleOn: true },
    },
  },
  {
    abilityName: 'medusa_split_shot',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { count: { lte: 1 }, range: { lte: 900 } },
      ability: { level: { gte: 1, lte: 3 } },
      action: { toggleOff: true },
    },
  },
  {
    abilityName: 'medusa_split_shot',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { gte: 3 }, range: { lte: 900 } },
      ability: { level: { gte: 2 } },
      action: { toggleOn: true },
    },
  },
  {
    abilityName: 'medusa_split_shot',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { lte: 1 }, range: { lte: 900 } },
      ability: { level: { gte: 1, lte: 3 } },
      action: { toggleOff: true },
    },
  },
];
