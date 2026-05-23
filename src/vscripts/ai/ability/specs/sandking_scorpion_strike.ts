import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 尾刺：DOTA_ABILITY_BEHAVIOR_POINT / AOE / ENEMY / HERO+BASIC，射程 200，半径 230–290。
 *
 * 仅对小兵施放，要求 ≥2 个目标在范围内。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sandking_scorpion_strike',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
];
