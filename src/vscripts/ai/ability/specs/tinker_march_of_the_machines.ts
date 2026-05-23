import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 机械行军 | AOE，cast range 300，AoE radius 900。
 *
 * - 对敌方英雄：在选中敌方英雄位置部署（dispatcher 选中 EnemyHero 后 CastAbilityOnPosition）。
 *   由 cast range 300 自动过滤——只有近距离接战时才用，保证 AoE 能命中。
 * - 对敌方小兵：范围内 ≥2 个小兵时清线；其余蓝量/血量/level/无敌英雄附近等限制由
 *   CREEP_DEFAULT_CONDITION 自动套用。
 * 移植自 bot_think_ability_use.lua Tinker hAbility2。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'tinker_march_of_the_machines',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'tinker_march_of_the_machines',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
      },
      // 覆盖 CREEP_DEFAULT_CONDITION 的 level >= 3：机械行军 2 级清线已够用
      ability: { level: { gte: 2 } },
    },
  },
];
