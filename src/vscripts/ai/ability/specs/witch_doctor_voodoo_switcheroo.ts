import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 魔晶变身：NO_TARGET，Shard 解锁，将自己变形为不利单位。
 *
 * KV 无施法距离字段，600 为搜索半径；自身血量吃紧时才用于脱身。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'witch_doctor_voodoo_switcheroo',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 } },
      self: { unitCondition: { healthPercent: { lte: 50 } } },
    },
  },
];
