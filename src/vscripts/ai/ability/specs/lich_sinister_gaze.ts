import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 巫妖 - 阴邪凝视：UNIT_TARGET | CHANNELLED / ENEMY。
 *
 * 把目标拉向队友，有队友跟进输出时才放；跳过已被控制的目标。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lich_sinister_gaze',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { allyHeroInRange: 1200 },
      target: {
        unitCondition: { notActionable: true },
      },
    },
  },
];
