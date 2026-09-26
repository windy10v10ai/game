import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 刚背兽 - 针刺扫射：NO_TARGET | AUTOCAST。
 *
 * 不开自动施法，由 bot 主动放：范围内有敌方英雄就放，只有小兵时要有多个才放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'bristleback_quill_spray',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'radius' },
    },
  },
  {
    abilityName: 'bristleback_quill_spray',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { gte: 2 }, rangeFromAbilityValue: 'radius' },
    },
  },
];
