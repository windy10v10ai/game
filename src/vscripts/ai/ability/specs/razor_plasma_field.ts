import { AbilitySpec, TargetSide } from '../ability-spec';

const target = { rangeFromAbilityValue: 'radius' };

export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'razor_plasma_field',
    targetSide: TargetSide.EnemyHero,
    condition: { target },
  },
  {
    abilityName: 'razor_plasma_field',
    targetSide: TargetSide.EnemyCreep,
    condition: { target },
  },
];
