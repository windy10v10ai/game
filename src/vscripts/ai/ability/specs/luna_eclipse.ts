import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 露娜 - 月蚀：NO_TARGET，有 A 杖时变为点目标。
 *
 * 有 A 杖时对施法距离内的敌人位置放；没有时只在敌人进入身边范围时放。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'luna_eclipse',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { hasScepter: true } },
    },
  },
  {
    abilityName: 'luna_eclipse',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'radius' },
    },
  },
];
