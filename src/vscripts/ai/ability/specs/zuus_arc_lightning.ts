import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 弧形闪电：低冷却的弹射闪电，宙斯的主要输出手段。
 *
 * 冷却只有 1.6 秒而耗蓝不低，不加蓝量下限会持续抽干蓝池，让雷击和大招永远放不出来——
 * 派发器按槽位顺序尝试，这个技能排在最前面，每轮都会先抢到机会。
 * 对小兵额外要求周围小兵足够多，为单个小兵放掉一次弹射不划算。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'zuus_arc_lightning',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { manaPercent: { gte: 30 } } },
    },
  },
  {
    abilityName: 'zuus_arc_lightning',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { gte: 3 } },
      self: { unitCondition: { manaPercent: { gte: 60 } } },
    },
  },
];
