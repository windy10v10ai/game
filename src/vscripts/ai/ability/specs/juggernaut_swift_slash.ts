import { AbilitySpec, TargetSide } from '../ability-spec';

/** 迅风斩：UNIT_TARGET / ENEMY / HERO+BASIC，Scepter 解锁的无敌之刃升级。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'juggernaut_swift_slash',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { hasScepter: true } },
    },
  },
];
