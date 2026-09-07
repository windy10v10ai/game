import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 跳舞：NO_TARGET + CHANNELLED，引导期间群体减速。
 *
 * 引导中 bot-base 的施法检查已让整个 think 循环提前返回，noModifier 只挡引导刚结束、
 * modifier 尚未清除的那一小段窗口，避免立刻重复触发。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'miku_dance',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 }, count: { gte: 2 } },
      self: { unitCondition: { noModifier: ['modifier_miku_dance'] } },
    },
  },
];
