import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 帕吉 - 肢解：UNIT_TARGET | CHANNELLED / ENEMY。
 *
 * 冷却短，近身就放；跳过已被控制的目标，等控制结束再接上。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'pudge_dismember',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { notActionable: true },
      },
    },
  },
];
