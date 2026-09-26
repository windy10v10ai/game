import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 复仇之魂 - 移形换位：UNIT_TARGET / CUSTOM。
 *
 * 把残血队友换到自己身边救人，或把残血敌人换进己方人堆；距离太近换了也没用，要求隔开一段。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'vengefulspirit_nether_swap',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        excludeSelf: true,
        range: { gte: 600 },
        unitCondition: { healthPercent: { lte: 30 } },
      },
    },
  },
  {
    abilityName: 'vengefulspirit_nether_swap',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { allyHeroInRange: 600, canEngage: true },
      target: {
        range: { gte: 600 },
        unitCondition: { healthPercent: { lte: 50 } },
      },
    },
  },
];
