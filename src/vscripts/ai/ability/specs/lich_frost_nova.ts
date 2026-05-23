import { AbilitySpec, TargetSide } from '../ability-spec';

/** 寒霜爆发：1 级伤害太低、蓝耗占比高，2 级起再用。 */
export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'lich_frost_nova',
    targetSide: TargetSide.EnemyHero,
    condition: {
      ability: { level: { gte: 2 } },
    },
  },
  {
    abilityName: 'lich_frost_nova',
    targetSide: TargetSide.EnemyCreep,
    condition: {
      target: {
        count: { gte: 2 },
      },
    },
  },
];
