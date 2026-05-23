import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 沙尘暴：DOTA_ABILITY_BEHAVIOR_NO_TARGET，半径 475/550/625/700（sand_storm_radius）。
 *
 * 作用范围内有英雄即施放；仅有小兵时要求 ≥2 个在半径内。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sandking_sand_storm',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        rangeFromAbilityValue: 'sand_storm_radius',
      },
    },
  },
  {
    abilityName: 'sandking_sand_storm',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 3 },
        rangeFromAbilityValue: 'sand_storm_radius',
      },
    },
  },
];
