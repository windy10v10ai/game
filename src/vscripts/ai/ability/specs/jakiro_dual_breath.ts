import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 冰火交加：POINT | UNIT_TARGET / ENEMY / HERO+BASIC，cast range 850。
 * dispatcher 在 UNIT_TARGET 分支优先派发，对选中单位 CastAbilityOnTarget。
 *
 * - 对敌方英雄：范围内任意敌方英雄即放。
 * - 对敌方小兵：范围内 ≥2 个小兵才出手；其余蓝量/血量/level/无敌英雄附近等限制由
 *   CREEP_DEFAULT_CONDITION 自动套用。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'jakiro_dual_breath',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'jakiro_dual_breath',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
];
