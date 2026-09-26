import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 幻影刺客 - 幻影突袭：UNIT_TARGET / CUSTOM，瞬移到目标身边。
 *
 * 跳进去就难退，只在会主动上去打的局面下跳；已经贴身的目标不必再跳。
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
];
