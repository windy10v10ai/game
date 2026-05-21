import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 火球术：POINT/AOE / ENEMY，射程 600，半径 275。需要 Shard，MaxLevel 1。
 *
 * EnemyCreep 覆盖默认 ability.level.gte: 3 → gte: 1（该技能只有 1 级）。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'dragon_knight_fireball',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: {
        unitCondition: { hasShard: true },
      },
    },
  },
  {
    abilityName: 'dragon_knight_fireball',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      self: {
        unitCondition: { hasShard: true },
      },
      target: {
        count: { gte: 2 },
      },
      ability: {
        level: { gte: 1 },
      },
    },
  },
];
