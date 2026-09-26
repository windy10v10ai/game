import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 迅风斩：UNIT_TARGET / ENEMY / HERO+BASIC，Scepter 解锁的无敌之刃升级。
 *
 * 剑刃风暴期间放不出来，等它结束再放，免得每 tick 空下令。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'juggernaut_swift_slash',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: {
        unitCondition: { hasScepter: true, noModifier: ['modifier_juggernaut_blade_fury'] },
      },
    },
  },
];
