import {
  calculateWarlockAwakenDamagePerSecond,
  calculateWarlockImmolationDamage,
  isWarlockImmolationDamageSpecial,
  isOwnedWarlockInfernalCandidate,
  isWarlockInfernalUnitName,
} from './warlock-awaken-math';

describe('calculateWarlockAwakenDamagePerSecond', () => {
  it('uses 150% of health and mana regeneration', () => {
    expect(calculateWarlockAwakenDamagePerSecond(40, 20, 150)).toBe(90);
  });

  it('supports the configured conversion percentage', () => {
    expect(calculateWarlockAwakenDamagePerSecond(40, 20, 90)).toBe(54);
  });

  it('does not produce negative damage when regeneration is negative', () => {
    expect(calculateWarlockAwakenDamagePerSecond(-40, -20, 100)).toBe(0);
  });
});

describe('calculateWarlockImmolationDamage', () => {
  it('adds 150% of Warlock health and mana regeneration to the native damage', () => {
    expect(calculateWarlockImmolationDamage(75, 40, 20, 150)).toBe(165);
  });

  it('keeps the native damage when the regeneration sum is negative', () => {
    expect(calculateWarlockImmolationDamage(75, -40, -20, 100)).toBe(75);
  });
});

describe('isWarlockImmolationDamageSpecial', () => {
  it('matches only Permanent Immolation aura_damage', () => {
    expect(
      isWarlockImmolationDamageSpecial('warlock_golem_permanent_immolation', 'aura_damage'),
    ).toBe(true);
  });

  it.each([
    ['warlock_golem_permanent_immolation', 'aura_radius'],
    ['warlock_rain_of_chaos', 'aura_damage'],
    ['custom_permanent_immolation', 'aura_damage'],
  ])('rejects unrelated ability special %s.%s', (abilityName, specialName) => {
    expect(isWarlockImmolationDamageSpecial(abilityName, specialName)).toBe(false);
  });
});

describe('isWarlockInfernalUnitName', () => {
  it.each([
    'npc_dota_warlock_golem',
    'npc_dota_warlock_golem_1',
    'npc_dota_warlock_golem_3',
    'npc_dota_warlock_golem_scepter_1',
    'npc_dota_warlock_golem_scepter_3',
  ])('accepts the runtime Warlock Infernal variant %s', (unitName) => {
    expect(isWarlockInfernalUnitName(unitName)).toBe(true);
  });

  it('rejects unrelated units', () => {
    expect(isWarlockInfernalUnitName('npc_dota_neutral_mud_golem')).toBe(false);
  });
});

describe('isOwnedWarlockInfernalCandidate', () => {
  const baseCandidate = {
    unitName: 'npc_dota_warlock_golem_1',
    hasPermanentImmolation: true,
    ownerEntityIndex: 101,
    warlockEntityIndex: 101,
    unitPlayerOwnerId: 3,
    warlockPlayerOwnerId: 3,
  };

  it.each([
    'npc_dota_warlock_golem',
    'npc_dota_warlock_golem_3',
    'npc_dota_warlock_golem_scepter_3',
  ])('accepts an owned Infernal variant with Permanent Immolation: %s', (unitName) => {
    expect(isOwnedWarlockInfernalCandidate({ ...baseCandidate, unitName })).toBe(true);
  });

  it('rejects an Infernal owned by another entity even when PlayerID matches', () => {
    expect(
      isOwnedWarlockInfernalCandidate({
        ...baseCandidate,
        ownerEntityIndex: 202,
      }),
    ).toBe(false);
  });

  it('falls back to a valid matching PlayerID only when owner entity is unavailable', () => {
    expect(
      isOwnedWarlockInfernalCandidate({
        ...baseCandidate,
        ownerEntityIndex: undefined,
      }),
    ).toBe(true);
  });

  it.each([
    { ownerEntityIndex: undefined, unitPlayerOwnerId: -1, warlockPlayerOwnerId: -1 },
    { ownerEntityIndex: undefined, unitPlayerOwnerId: 4, warlockPlayerOwnerId: 3 },
    { hasPermanentImmolation: false },
    { unitName: 'npc_dota_neutral_mud_golem' },
  ])('rejects an invalid candidate: %o', (overrides) => {
    expect(isOwnedWarlockInfernalCandidate({ ...baseCandidate, ...overrides })).toBe(false);
  });
});
