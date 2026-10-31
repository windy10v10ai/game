import { AbilitySpec, TargetSide } from '../ability-spec';

/** 秘术异蛇：优先用于敌方英雄，兵群满足数量时用于清线。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'medusa_mystic_snake',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'medusa_mystic_snake',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { gte: 2 } },
    },
  },
];
