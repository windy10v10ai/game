import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 赏金猎人 - 追踪术：UNIT_TARGET / ENEMY。
 *
 * 便宜且冷却短，见到就标记，不重复标记同一目标。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'bounty_hunter_track',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        unitCondition: { noModifier: ['modifier_bounty_hunter_track'] },
      },
    },
  },
];
