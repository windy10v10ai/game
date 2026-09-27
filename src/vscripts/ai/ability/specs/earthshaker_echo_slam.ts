import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 撼地者 - 回音击：NO_TARGET。
 *
 * 优先多名敌方英雄同时在范围内；只有一名时要贴身才放，近身还能补一次余震。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'earthshaker_echo_slam',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { count: { gte: 2 }, rangeFromAbilityValue: 'echo_slam_damage_range' },
    },
  },
  {
    abilityName: 'earthshaker_echo_slam',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 300 } },
    },
  },
];
