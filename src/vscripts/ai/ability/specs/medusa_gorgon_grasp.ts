import { AbilitySpec, TargetSide } from '../ability-spec';

/** 罗网箭阵：优先用于敌方英雄，兵群满足数量时用于清线。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'medusa_gorgon_grasp',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'medusa_gorgon_grasp',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { gte: 2 } },
    },
  },
];
