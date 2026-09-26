import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 龙骑士 - 古龙形态：NO_TARGET。
 *
 * 变身增加射程与溅射，打架与推塔都开。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'dragon_knight_elder_dragon_form',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 1200 } },
    },
  },
  {
    abilityName: 'dragon_knight_elder_dragon_form',
    targetSide: TargetSide.EnemyBuilding,
    condition: {
      self: {
        noEnemyHeroInRange: 1200,
        friendlyCreepNearby: { count: { gte: 3 } },
      },
      target: { range: { lte: 800 } },
    },
  },
];
