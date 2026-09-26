import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 力丸 - 闪烁突袭：UNIT_TARGET / CUSTOM，闪到目标身后。
 *
 * 跳进去就难退，只在会主动上去打的局面下跳；已经贴身的目标不必再跳。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'riki_blink_strike',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { canEngage: true },
      target: { range: { gte: 300 } },
    },
  },
];
