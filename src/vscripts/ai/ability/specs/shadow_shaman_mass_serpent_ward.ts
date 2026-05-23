import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 暗影萨满 - 群蛇守卫：POINT | AOE。
 *
 * 对英雄：需 2 个以上敌方英雄聚集才施放，避免大招浪费。
 * 对建筑：推塔模式——周围无敌英雄（1200 内）且己方小兵 >= 3 时对防御塔施放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'shadow_shaman_mass_serpent_ward',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
  {
    abilityName: 'shadow_shaman_mass_serpent_ward',
    targetSide: TargetSide.EnemyBuilding,
    condition: {
      self: {
        noEnemyHeroInRange: 1200,
        friendlyCreepNearby: { count: { gte: 3 } },
      },
    },
  },
];
