import { AbilitySpec, TargetSide } from '../ability-spec';

/** 冰火交加 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'jakiro_dual_breath',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'jakiro_dual_breath',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
];
