import { AbilitySpec, TargetSide } from '../ability-spec';

/** 折跃手雷：KV cast range 700，限制 300 内才用，避免远距离骚扰浪费。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'tinker_warp_grenade',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        range: { lte: 300 },
      },
    },
  },
];
