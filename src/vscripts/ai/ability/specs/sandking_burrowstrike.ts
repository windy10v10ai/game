import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 穿刺：DOTA_ABILITY_BEHAVIOR_POINT / ENEMY / HERO+BASIC，射程 550–775。
 *
 * 对英雄要求自身 HP ≥ 20%（防止残血送死）；对小兵要求 ≥2 个目标。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sandking_burrowstrike',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: {
        unitCondition: { healthPercent: { gte: 20 } },
      },
    },
  },
  {
    abilityName: 'sandking_burrowstrike',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
];
