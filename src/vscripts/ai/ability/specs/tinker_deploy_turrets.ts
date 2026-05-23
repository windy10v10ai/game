import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 部署炮塔：DOTA_ABILITY_BEHAVIOR_POINT | AOE / ENEMY / HERO+BASIC，CastRange 600。
 *
 * - 对敌方英雄：dispatcher 选中范围内的敌方英雄，在其位置部署 3 个不可控炮塔，
 *   落地有冲击伤害与击退，之后炮塔自动向附近敌方英雄发射导弹。
 * - 对敌方小兵：范围内 ≥2 个小兵时清线/控线；level >= 2 即可（覆盖默认 level 3）。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'tinker_deploy_turrets',
    targetSide: TargetSide.EnemyHero,
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
