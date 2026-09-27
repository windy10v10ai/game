import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 戴泽 - 薄葬：UNIT_TARGET / FRIENDLY。
 *
 * 保命技能，交战中给快死的队友（包括自己）。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'dazzle_shallow_grave',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      self: { enemyHeroInRange: 1200 },
      target: {
        unitCondition: { healthPercent: { lte: 25 } },
      },
    },
  },
];
