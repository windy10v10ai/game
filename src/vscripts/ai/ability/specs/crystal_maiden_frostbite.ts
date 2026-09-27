import { AbilitySpec, TargetSide } from '../ability-spec';

/** 冰封禁制：打野时控制较耐打的目标。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'crystal_maiden_frostbite',
    targetSide: TargetSide.EnemyHero,
  },
  {
    abilityName: 'crystal_maiden_frostbite',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        unitCondition: { health: { gte: 1001 }, neutralOnly: true },
        count: { gte: 1 },
      },
      ability: { level: { gte: 1 } },
    },
  },
];
