import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 小小 - 抓树：目标是树。
 *
 * 附近有敌方英雄、手上还没有树时抓最近的一棵。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'tiny_tree_grab',
    targetSide: TargetSide.Tree,
    condition: {
      self: {
        enemyHeroInRange: 1200,
        unitCondition: { noModifier: ['modifier_tiny_tree_grab'] },
      },
    },
  },
];
