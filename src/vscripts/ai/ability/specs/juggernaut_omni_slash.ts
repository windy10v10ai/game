import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 主宰 - 无敌斩：UNIT_TARGET / ENEMY。
 *
 * 期间无敌，见到就放，兼作开团与躲技能。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'juggernaut_omni_slash',
    targetSide: TargetSide.EnemyHero,
  },
];
