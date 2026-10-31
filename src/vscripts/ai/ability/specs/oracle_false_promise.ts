import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 神谕者 - 虚妄之诺：UNIT_TARGET / FRIENDLY。
 *
 * 保命大招，交战中给快死的队友（包括自己）。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'oracle_false_promise',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      self: { enemyHeroInRange: 1200 },
      target: {
        unitCondition: { healthPercent: { lte: 35 } },
      },
    },
  },
];
