import { AbilityRegistry } from './ability-registry';
import { AbilitySpec } from './ability-spec';

describe('AbilityRegistry', () => {
  beforeEach(() => {
    AbilityRegistry._clear();
  });

  it('returns undefined for unknown ability', () => {
    expect(AbilityRegistry.get('not_registered')).toBeUndefined();
  });

  it('registers and retrieves a single spec', () => {
    const spec: AbilitySpec = { abilityName: 'lion_finger_of_death', targetSide: 'enemyHero' };
    AbilityRegistry.register(spec);
    expect(AbilityRegistry.get('lion_finger_of_death')).toEqual([spec]);
  });

  it('preserves registration order for multiple specs on same ability', () => {
    const specA: AbilitySpec = {
      abilityName: 'medusa_split_shot',
      targetSide: 'enemyHero',
      condition: { target: { count: { gte: 1 } } },
    };
    const specB: AbilitySpec = {
      abilityName: 'medusa_split_shot',
      targetSide: 'enemyCreep',
      condition: { target: { count: { gte: 3 } } },
    };
    AbilityRegistry.register(specA);
    AbilityRegistry.register(specB);

    const result = AbilityRegistry.get('medusa_split_shot');
    expect(result).toEqual([specA, specB]);
  });

  it('registerAll appends specs in order', () => {
    const specs: AbilitySpec[] = [
      { abilityName: 'ability_a', targetSide: 'self' },
      { abilityName: 'ability_b', targetSide: 'enemyHero' },
    ];
    AbilityRegistry.registerAll(specs);
    expect(AbilityRegistry.get('ability_a')).toEqual([specs[0]]);
    expect(AbilityRegistry.get('ability_b')).toEqual([specs[1]]);
  });
});
