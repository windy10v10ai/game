import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 主宰 - 无敌斩：UNIT_TARGET / ENEMY。
 *
 * 期间无敌，见到就放，兼作开团与躲技能。剑刃风暴期间放不出来，等它结束再放，免得每 tick 空下令。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'juggernaut_omni_slash',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: {
        unitCondition: { noModifier: ['modifier_juggernaut_blade_fury'] },
      },
    },
  },
];
