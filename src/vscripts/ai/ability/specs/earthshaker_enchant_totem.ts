import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 撼地者 - 强化图腾：NO_TARGET，有 A 杖时可点地跳过去。
 *
 * 敌人贴身时以自己为目标开，已强化不重复开；有 A 杖时对稍远的敌人点地跳过去砸。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'earthshaker_enchant_totem',
    targetSide: TargetSide.Self,
    condition: {
      self: {
        unitCondition: { noModifier: ['modifier_earthshaker_enchant_totem'] },
        enemyHeroInRange: 300,
      },
    },
  },
  {
    abilityName: 'earthshaker_enchant_totem',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: {
        unitCondition: {
          hasScepter: true,
          noModifier: ['modifier_earthshaker_enchant_totem'],
        },
      },
      target: { range: { gte: 300 } },
    },
  },
];
