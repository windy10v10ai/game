import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 暗影萨满 - 巨蟒之瓮（Shard 群蛇守卫升级）：POINT | AOE / ENEMY。
 *
 * 逻辑与 mass_serpent_ward 相同：多英雄聚团或推塔波到来时施放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'shadow_shaman_urnaconda',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
  {
    abilityName: 'shadow_shaman_urnaconda',
    targetSide: TargetSide.EnemyBuilding,
    condition: {
      self: {
        noEnemyHeroInRange: 1200,
        friendlyCreepNearby: { count: { gte: 3 } },
      },
    },
  },
];
