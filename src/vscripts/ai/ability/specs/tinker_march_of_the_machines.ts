import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 机械行军：POINT | AOE，cast range 300，AoE radius 900，distance 1800。
 *
 * 用 castMode='projectedOnCastRange'：搜索半径放宽到 900（机器人云团半径）。
 * 敌人在 cast range 300 内 → 释放点 = 敌人位置；敌人在 300~900 → 释放点压到自身
 * cast range 远端朝敌人方向，让 AoE 边缘扫到，避免老逻辑"非要近身才放"的浪费。
 *
 * - 对敌方英雄：900 内任意敌方英雄即放。
 * - 对敌方小兵：要求 900 内 ≥2 个小兵；level >= 2 即可（覆盖默认 level 3）。
 * 移植自 bot_think_ability_use.lua Tinker hAbility2。
 */
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
      // 覆盖 CREEP_DEFAULT_CONDITION 的 level >= 3：机械行军 2 级清线已够用
      ability: { level: { gte: 2 } },
    },
  },
];
