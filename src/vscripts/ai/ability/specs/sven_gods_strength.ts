import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 斯温 - 神之力量：NO_TARGET 自身增益。
 *
 * 近战，敌人靠近时开。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'sven_gods_strength',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 } },
    },
  },
];
