import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 战争饥渴：DOTA_ABILITY_BEHAVIOR_UNIT_TARGET / ENEMY / HERO | BASIC，不穿魔法免疫。
 *
 * 无额外条件，施法范围内第一个可见敌方英雄即施放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'axe_battle_hunger',
    targetSide: TargetSide.EnemyHero,
  },
];
