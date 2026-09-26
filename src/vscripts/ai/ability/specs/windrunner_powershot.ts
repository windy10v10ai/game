import { AbilitySpec, TargetSide } from '../ability-spec';

/**
 * 风行者 - 强力击：POINT | CHANNELLED。
 *
 * 冷却短，打英雄之外也清兵。
 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'windrunner_powershot',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'windrunner_powershot',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: { count: { gte: 3 } },
    },
  },
];
