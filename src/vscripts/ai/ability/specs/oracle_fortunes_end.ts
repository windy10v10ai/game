import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 神谕者 - 气运之末：UNIT_TARGET | CHANNELLED / BOTH。
 *
 * 只对敌人放，跳过已被控制的目标；蓄力时间难把握，放出后立刻结束引导让它马上生效。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'oracle_fortunes_end',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { notActionable: true },
      },
    },
    stopChannel: { afterSeconds: 0 },
  },
];
