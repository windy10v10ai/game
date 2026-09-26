import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 小小 - 投掷：UNIT_TARGET / CUSTOM，抓起身边最近的单位扔向目标。
 *
 * 对身边的敌方英雄放，把他原地抓起砸下；身边没有可抓的单位时施法会失败，所以只选抓取范围内的目标。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'tiny_toss',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: { rangeFromAbilityValue: 'grab_radius' },
    },
  },
];
