import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 刀阵旋风：NO_TARGET，穿魔法免疫。
 *
 * KV 无施法距离字段，以 AbilityValues 的 radius 作为搜索上限。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'phantom_assassin_fan_of_knives',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'radius', ignoresMagicImmune: true },
    },
  },
];
