import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 死亡先知 - 驱使恶灵：NO_TARGET。
 *
 * 恶灵也会攻击建筑，打架与推塔都放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'death_prophet_exorcism',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'radius' },
    },
  },
  {
    abilityName: 'death_prophet_exorcism',
    targetSide: TargetSide.EnemyBuilding,
    condition: {
      self: {
        noEnemyHeroInRange: 1200,
        friendlyCreepNearby: { count: { gte: 3 } },
      },
      target: { rangeFromAbilityValue: 'radius' },
    },
  },
];
