const fs = require('fs');
const path = require('path');
const { KeyValues } = require('easy-keyvalues');

async function parseKv(relativePath) {
  const absolutePath = path.join(__dirname, '..', relativePath);
  const source = fs
    .readFileSync(absolutePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => !/^\s*#base\s+/.test(line))
    .join('\n');

  return KeyValues.Parse(source);
}

function requireChild(parent, key) {
  const child = parent.FindKey(key);
  if (!child) {
    throw new Error(`Missing KeyValues key: ${key}`);
  }
  return child;
}

function requireValue(parent, key) {
  return requireChild(parent, key).GetValue();
}

describe('Warlock Infernal durability balance', () => {
  let rainOfChaosValues;
  let infernalUnit;
  let durabilityAbility;

  beforeAll(async () => {
    const abilityOverrides = await parseKv('game/scripts/npc/npc_abilities_override.txt');
    const customUnits = await parseKv('game/scripts/npc/npc_units_custom.txt');
    const customAbilities = await parseKv('game/scripts/npc/npc_abilities_custom.txt');

    const overrideTable = requireChild(abilityOverrides, 'DOTAAbilities');
    const unitTable = requireChild(customUnits, 'DOTAUnits');
    const abilityTable = requireChild(customAbilities, 'DOTAAbilities');

    rainOfChaosValues = requireChild(
      requireChild(overrideTable, 'warlock_rain_of_chaos'),
      'AbilityValues',
    );
    infernalUnit = requireChild(unitTable, 'npc_dota_warlock_golem');
    durabilityAbility = requireChild(abilityTable, 'warlock_golem_durability');
  });

  test('uses the requested four-level health and armor progression', () => {
    expect(requireValue(requireChild(rainOfChaosValues, 'golem_hp'), 'value')).toBe(
      '3500 5500 7500 9500',
    );
    expect(
      requireValue(requireChild(rainOfChaosValues, 'golem_hp_scepter'), 'special_bonus_scepter'),
    ).toBe('3500 5500 7500 9500');
    expect(requireValue(rainOfChaosValues, 'golem_armor')).toBe('40 60 90 110');
    expect(requireValue(requireChild(rainOfChaosValues, 'tooltip_golem_armor'), 'value')).toBe(
      '40 60 90 110',
    );
  });

  test('raises the level 20 Infernal damage reduction talent to 80%', () => {
    expect(
      requireValue(
        requireChild(rainOfChaosValues, 'bonus_damage_resist'),
        'special_bonus_unique_warlock_1',
      ),
    ).toBe('+80');
  });

  test('gives every Infernal 75% magic resistance and the hidden durability passive', () => {
    expect(requireValue(infernalUnit, 'MagicalResistance')).toBe('75');
    expect(requireValue(infernalUnit, 'Ability3')).toBe('warlock_golem_durability');
  });

  test('the hidden passive grants 50% stacking status resistance', () => {
    expect(requireValue(durabilityAbility, 'BaseClass')).toBe('ability_lua');
    expect(requireValue(durabilityAbility, 'ScriptFile')).toBe(
      'abilities/warlock_golem_durability',
    );
    expect(requireValue(durabilityAbility, 'MaxLevel')).toBe('1');

    const behavior = requireValue(durabilityAbility, 'AbilityBehavior');
    expect(behavior).toContain('DOTA_ABILITY_BEHAVIOR_PASSIVE');
    expect(behavior).toContain('DOTA_ABILITY_BEHAVIOR_HIDDEN');
    expect(
      requireValue(requireChild(durabilityAbility, 'AbilityValues'), 'status_resistance'),
    ).toBe('50');
  });
});
