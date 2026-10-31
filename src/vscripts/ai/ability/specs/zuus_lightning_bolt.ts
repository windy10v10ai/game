import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 雷击：宙斯的单体高伤指向技能。
 *
 * 同时具备单位目标与点目标两种 behavior，dispatcher 优先按单位目标派发，
 * 必定命中，不受走位影响，因此不需要任何额外条件。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'zuus_lightning_bolt',
    targetSide: TargetSide.EnemyHero,
  },
];
