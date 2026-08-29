import { AbilitySpec, TargetSide } from '../ability-spec';

/** GET DOWN!!!：NO_TARGET + CHANNELLED，Scepter 解锁的引导重击。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'get_down',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { range: { lte: 600 }, count: { gte: 2 } },
    },
  },
];
