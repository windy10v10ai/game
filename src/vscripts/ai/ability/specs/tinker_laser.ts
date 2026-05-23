import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 激光：UNIT_TARGET / ENEMY / HERO+BASIC，cast range 600。
 *
 * 范围内任意敌方英雄即可释放。移植自 bot_think_ability_use.lua Tinker hAbility1。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'tinker_laser',
    targetSide: TargetSide.EnemyHero,
  },
];
