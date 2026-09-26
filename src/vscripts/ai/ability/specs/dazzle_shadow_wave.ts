import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 戴泽 - 暗影波：UNIT_TARGET / FRIENDLY，治疗弹跳并伤害被治疗单位身边的敌人。
 *
 * 队友掉血就奶；另外对身边挤着一堆敌人的队友或己方小兵放，当伤害技能用。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'dazzle_shadow_wave',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        unitCondition: { healthPercent: { lte: 80 } },
      },
    },
  },
  {
    abilityName: 'dazzle_shadow_wave',
    targetSide: TargetSide.FriendlyHero,
    condition: {
      target: {
        enemiesNearby: { range: 200, count: 3 },
      },
    },
  },
  {
    abilityName: 'dazzle_shadow_wave',
    targetSide: TargetSide.FriendlyCreep,
    condition: {
      target: {
        enemiesNearby: { range: 200, count: 3 },
      },
    },
  },
];
