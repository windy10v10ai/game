import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 部署炮塔：DOTA_ABILITY_BEHAVIOR_POINT | AOE / ENEMY / HERO+BASIC，CastRange 600。
 *
 * 用 castMode='projectedOnCastRange'：搜索半径放宽到 1800（炮塔导弹的有效作用域）。
 * 敌人在 cast range 600 内 → 释放点 = 敌人位置；敌人在 600~1800 → 释放点压到自身
 * cast range 远端朝敌人方向，让导弹仍能锁定敌人。
 *
 * - 对敌方英雄：1800 内任意敌方英雄即放。
 * - 对敌方小兵：范围内 ≥2 个小兵；level >= 2 即可（覆盖默认 level 3）。
 */
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
      target: {
        count: { gte: 2 },
      },
      // 覆盖 CREEP_DEFAULT_CONDITION 的 level >= 3
      ability: { level: { gte: 2 } },
    },
  },
];
