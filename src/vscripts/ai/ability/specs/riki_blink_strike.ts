import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 力丸 - 闪烁突袭：UNIT_TARGET / CUSTOM，闪到目标身后。
 *
 * 跳进去就难退，只在这波交战打得过时跳；已经贴身的目标不必再跳。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'riki_blink_strike',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { canWinFight: true },
      target: { range: { gte: 300 } },
    },
  },
];
