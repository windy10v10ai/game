import { AbilitySpec, TargetSide } from '../ability-spec';

/** 瞄准：与敌人拉开适合开火的距离时施放。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sniper_take_aim',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { gte: 600, lte: 1500 } },
    },
  },
];
