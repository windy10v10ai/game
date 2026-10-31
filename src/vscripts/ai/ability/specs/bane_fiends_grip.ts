import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 痛苦之源 - 魔爪：UNIT_TARGET | CHANNELLED / ENEMY / HERO | BASIC。
 *
 * 单独控人杀不死目标，只在有队友能跟进输出时放；持续施法伤害高，目标已被控制也照放，让控制重叠。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'bane_fiends_grip',
    targetSide: TargetSide.EnemyHero,
    control: true,
    condition: {
      self: { allyHeroInRange: 1200 },
    },
  },
];
