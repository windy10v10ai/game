import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 神谕者 - 涤罪之焰：UNIT_TARGET，敌我都能放，先伤害后持续治疗。
 *
 * 对敌人只在预计连放能打死时放，否则后续治疗反而帮了对方；
 * 队友身上有命运敕令或虚妄之诺时伤害被挡下或延后，只剩治疗，可以反复放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'oracle_purifying_flames',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: {
          hasModifier: ['modifier_oracle_fates_edict', 'modifier_oracle_false_promise_timer'],
        },
      },
    },
  },
  {
    abilityName: 'oracle_purifying_flames',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: {
          healthAbilityValue: { key: 'damage', lte: true, includeSpellAmp: true, multiplier: 2 },
        },
      },
    },
  },
];
