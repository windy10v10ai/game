import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 混沌之军：NO_TARGET。
 *
 * KV 施法距离 1400，显式收窄到 600，避免过早在敌人接近前开大。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'imba_chaos_knight_phantasm',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 } },
    },
  },
];
