import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 主宰 - 治疗守卫：POINT | AOE。
 *
 * 放在掉血的队友（包括自己）身边，守卫会跟着走。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'juggernaut_healing_ward',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 60 } },
      },
    },
  },
];
