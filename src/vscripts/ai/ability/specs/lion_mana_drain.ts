import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 法力吸取：UNIT_TARGET / ENEMY / HERO。
 *
 * 对任意可见敌方英雄施放，不加额外限制。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lion_mana_drain',
    targetSide: TargetSide.EnemyHero,
  },
];
