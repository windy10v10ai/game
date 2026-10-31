import { AbilitySpec, TargetSide } from '../ability-spec';

/** 葱击：UNIT_TARGET / ENEMY / HERO+BASIC，变身形态下与 chibi_monster 共享同一槽位互斥切换。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'chibi_hit',
    targetSide: TargetSide.EnemyHero,
  },
];
