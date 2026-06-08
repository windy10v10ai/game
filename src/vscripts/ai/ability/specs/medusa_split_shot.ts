import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 分裂箭：NO_TARGET | TOGGLE。开启后攻击分裂打多目标，但降低单体伤害。
 *
 * 900 内 ≥2 敌方英雄/小兵时开启群战/清线，≤1 且等级未满（lvl≤3，伤害惩罚相对高）时关闭。
 * count 区间留缓冲带避免边界横跳。自 hero-medusa.ts 迁移而来。
 * 对小兵 dispatcher 自动套 creep 默认条件（附近无敌英雄才触发，避免与对英雄逻辑打架）。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'medusa_split_shot',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { count: { gte: 2 }, range: { lte: 900 } },
      action: { toggleOn: true },
    },
  },
  {
    abilityName: 'medusa_split_shot',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { count: { lte: 1 }, range: { lte: 900 } },
      ability: { level: { lte: 3 } },
      action: { toggleOff: true },
    },
  },
  {
    abilityName: 'medusa_split_shot',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { gte: 2 }, range: { lte: 900 } },
      action: { toggleOn: true },
    },
  },
  {
    abilityName: 'medusa_split_shot',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { lte: 1 }, range: { lte: 900 } },
      ability: { level: { lte: 3 } },
      action: { toggleOff: true },
    },
  },
];
