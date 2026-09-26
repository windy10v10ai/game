import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 撼地者 - 强化图腾：NO_TARGET，有 A 杖时可点地跳过去。
 *
 * 敌人贴身时以自己为目标开，已强化不重复开。有 A 杖时对稍远的敌人点地跳过去：跳跃本身能拉近距离、落地触发余震，
 * 身上还留着没打出去的强化也照样跳；跳进去就难退，只在会主动上去打的局面下跳。
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
      self: { unitCondition: { hasScepter: true }, canEngage: true },
      target: { range: { gte: 300 }, castMode: 'targetPosition' },
    },
  },
];
