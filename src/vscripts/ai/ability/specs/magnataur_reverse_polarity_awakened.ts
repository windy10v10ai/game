import { AbilitySpec, TargetSide } from '../ability-spec';

export const SPECS: AbilitySpec[] = [
  {
    abilityName: 'magnataur_reverse_polarity_awakened',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        rangeFromAbilityValue: 'pull_radius',
        ignoresMagicImmune: true,
      },
    },
  },
  {
    abilityName: 'magnataur_reverse_reverse_polarity_awakened',
    targetSide: TargetSide.EnemyHero,
    condition: {
      target: {
        rangeFromAbilityValue: 'push_radius',
        ignoresMagicImmune: true,
      },
    },
  },
];
