import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * Q版初音未来：NO_TARGET，变身进入巨型形态，与 chibi_hit 共享同一槽位互斥切换。
 *
 * KV 无施法距离字段，900 与 chibi_hit 的对敌搜索半径保持一致。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'chibi_monster',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 900 } },
      self: { unitCondition: { noModifier: ['modifier_chibi_monster'] } },
    },
  },
];
