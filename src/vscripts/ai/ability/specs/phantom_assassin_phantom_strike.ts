import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 幻影刺客 - 幻影突袭：UNIT_TARGET / CUSTOM，瞬移到目标身边。
 *
 * 对英雄：跳进去就难退，只在会主动上去打的局面下跳；已经贴身的目标不必再跳。
 * 对小兵：冷却短、带攻速加成，有一个就跳过去刷，按默认清兵门槛放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'phantom_assassin_phantom_strike',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { canEngage: true },
      target: { range: { gte: 300 } },
    },
  },
  {
    abilityName: 'phantom_assassin_phantom_strike',
    targetSide: TargetSide.EnemyCreep,
  },
];
