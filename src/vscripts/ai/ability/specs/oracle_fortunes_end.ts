import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 神谕者 - 气运之末：UNIT_TARGET | CHANNELLED / BOTH。
 *
 * 只对敌人放，目标已被控制也照放，让控制重叠；蓄力时间难把握，放出后立刻结束引导让它马上生效。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'oracle_fortunes_end',
    targetSide: TargetSide.EnemyHero,
    control: true,
    stopChannel: { afterSeconds: 0 },
  },
];
