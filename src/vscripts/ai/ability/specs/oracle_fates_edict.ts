import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 神谕者 - 命运敕令：UNIT_TARGET，敌我都能放。
 *
 * 只给交战中残血的队友挡法术伤害，之后可以接涤罪之焰纯治疗；不对敌人放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'oracle_fates_edict',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      self: { enemyHeroInRange: 1200 },
      target: {
        unitCondition: {
          healthPercent: { lte: 40 },
          noModifier: ['modifier_oracle_fates_edict'],
        },
      },
    },
  },
];
