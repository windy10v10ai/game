import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 魅影无形：NO_TARGET，先天技能，Shard 强化。
 *
 * 不加敌人条件，有神杖且自身没有该状态时就开。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'phantom_assassin_blur',
    targetSide: TargetSide.Self,
    condition: {
      self: {
        unitCondition: {
          hasScepter: true,
          noModifier: 'modifier_phantom_assassin_blur_active',
        },
      },
    },
  },
];
