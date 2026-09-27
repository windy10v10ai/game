import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 痛苦之源 - 魔爪：UNIT_TARGET | CHANNELLED / ENEMY / HERO | BASIC。
 *
 * 单独控人杀不死目标，只在有队友能跟进输出时放；跳过已被控制的目标，避免浪费持续施法时间。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'bane_fiends_grip',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { allyHeroInRange: 1200 },
      target: {
        unitCondition: { notActionable: true },
      },
    },
  },
];
