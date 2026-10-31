import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 无光之盾：给友军套一层护盾，纯增益，给自己用同样合理，因此不排除施法者。
 *
 * noModifier 防止在护盾持续期内重复覆盖。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'abaddon_aphotic_shield',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: {
          healthPercent: { lte: 90 },
          noModifier: ['modifier_abaddon_aphotic_shield'],
        },
      },
    },
  },
];
