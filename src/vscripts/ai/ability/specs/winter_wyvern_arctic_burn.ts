import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 严寒烧灼：基础 NO_TARGET 主动；有 A 杖时变为开关型（持续飞行、每秒耗蓝）。
 *
 * 持续耗蓝，故按敌情开关：有 A 杖时，1800 内有敌方英雄 toggleOn 进入飞行形态，
 * 1800 内无敌方英雄 toggleOff 退出省蓝（1800 = bot 预搜半径 aroundEnemyHeroes）。
 * 无 A 杖时不是开关技能，spec 不触发。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'winter_wyvern_arctic_burn',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: { unitCondition: { hasScepter: true } },
      target: { range: { lte: 1800 } },
      action: { toggleOn: true },
    },
  },
  {
    abilityName: 'winter_wyvern_arctic_burn',
    targetSide: TargetSide.Self,
    condition: {
      self: { unitCondition: { hasScepter: true }, noEnemyHeroInRange: 1800 },
      action: { toggleOff: true },
    },
  },
];
