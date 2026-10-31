import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 腾焰斗篷：NO_TARGET + IMMEDIATE，Scepter 解锁。
 *
 * KV 无施法距离字段，900 为搜索半径。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lina_flame_cloak',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 } },
    },
  },
];
