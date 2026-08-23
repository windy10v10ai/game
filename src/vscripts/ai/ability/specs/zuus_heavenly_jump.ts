import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 神圣一跳：向自身朝向跳跃并震击范围内的敌人。
 *
 * 伤害与跳跃方向无关，位移是纯风险，所以按目标方位拆成两种用法：
 * 血量健康时朝正面的敌人跳过去追击，血量吃紧时只在敌人位于背面时跳走脱身。
 * 用距离判定替代不可行——跳跃距离与作用范围重叠，要求「跳完仍拉开距离」会让可选目标为空。
 *
 * 施法距离为 0，搜索上限取 AbilityValues 的 range。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'zuus_heavenly_jump',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'range', facing: 'front' },
      self: { unitCondition: { healthPercent: { gte: 90 } } },
    },
  },
  {
    abilityName: 'zuus_heavenly_jump',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'range', facing: 'back' },
      self: { unitCondition: { healthPercent: { lte: 80 } } },
    },
  },
];
