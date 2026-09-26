import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 撼地者 - 强化图腾：NO_TARGET，有 A 杖时可点地跳过去。
 *
 * 有 A 杖时对稍远的敌人跳过去砸；否则敌人贴身才开，已强化不重复开。
 */
export const SPECS: AbilitySpec[] = [
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
  {
    abilityName: 'earthshaker_enchant_totem',
    targetSide: TargetSide.EnemyHero,
    condition: {
      self: {
        unitCondition: { noModifier: ['modifier_earthshaker_enchant_totem'] },
      },
      target: { range: { lte: 300 } },
    },
  },
];
