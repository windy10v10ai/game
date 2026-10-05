import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 巫妖 - 阴邪凝视：UNIT_TARGET | CHANNELLED / ENEMY。
 *
 * 把目标拉向队友，有队友跟进输出时才放；持续施法时间长，目标已被控制也照放，让控制重叠。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lich_sinister_gaze',
    targetSide: TargetSide.EnemyHero,
    control: true,
    condition: {
      self: { allyHeroInRange: 1200 },
    },
  },
];
