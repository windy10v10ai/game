import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 痛苦之源 - 噩梦：UNIT_TARGET / BOTH / HERO | CREEP。
 *
 * 目标受到伤害就会醒来，只在附近没有队友时放，用来单挑拖时间、等队友赶到或逃跑。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'bane_nightmare',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { noAllyHeroInRange: 900 },
      target: {
        unitCondition: { notActionable: true },
      },
    },
  },
];
