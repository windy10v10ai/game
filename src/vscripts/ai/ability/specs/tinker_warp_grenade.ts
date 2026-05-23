import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 折跃摇光：UNIT_TARGET / ENEMY / HERO+BASIC，KV cast range 700（Shard 技能）。
 *
 * 老逻辑限制在 300 范围内才用（近身脱困/反打），不远距离骚扰浪费。
 * 移植自 bot_think_ability_use.lua Tinker hAbility4。
 */
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
