import {
  buildInheritedAbilityRuntimeSignature,
  buildLoneDruidBearInheritanceSignature,
  calculateInheritedAbilityDiff,
  collectInheritableAbilities,
  isOwnedLoneDruidSpiritBearCandidate,
} from './lone-druid-bear-inheritance';
import { calculateBonusSkillPointCount } from '../../modules/property/property-calculations';

describe('collectInheritableAbilities', () => {
  const allowed = new Set(['axe_berserkers_call', 'bristleback_bristleback', 'axe_counter_helix']);

  it('keeps only lottery abilities and preserves current levels', () => {
    expect(
      collectInheritableAbilities(
        [
          { name: 'axe_berserkers_call', level: 3 },
          { name: 'bristleback_bristleback', level: 2 },
          { name: 'lone_druid_spirit_bear', level: 4 },
          { name: 'special_bonus_unique_lone_druid_upgrade', level: 1 },
          { name: 'item_tpscroll', level: 1 },
          { name: 'unknown_custom_ability', level: 1 },
        ],
        allowed,
      ),
    ).toEqual([
      { name: 'axe_berserkers_call', level: 3 },
      { name: 'bristleback_bristleback', level: 2 },
    ]);
  });

  it('keeps a newly added tome ability before it gains a level', () => {
    expect(collectInheritableAbilities([{ name: 'axe_counter_helix', level: 0 }], allowed)).toEqual(
      [{ name: 'axe_counter_helix', level: 0 }],
    );
  });

  it('deduplicates ability names and keeps the highest current level', () => {
    expect(
      collectInheritableAbilities(
        [
          { name: 'axe_counter_helix', level: 1 },
          { name: 'axe_counter_helix', level: 3 },
        ],
        allowed,
      ),
    ).toEqual([{ name: 'axe_counter_helix', level: 3 }]);
  });
});

describe('calculateInheritedAbilityDiff', () => {
  it('removes the reset-book old skill and adds its replacement', () => {
    expect(
      calculateInheritedAbilityDiff(
        [
          { name: 'bristleback_bristleback', level: 2 },
          { name: 'sven_gods_strength', level: 1 },
        ],
        {
          axe_berserkers_call: 3,
          bristleback_bristleback: 2,
        },
      ),
    ).toEqual({
      add: [{ name: 'sven_gods_strength', level: 1 }],
      update: [],
      remove: ['axe_berserkers_call'],
    });
  });

  it('adds a passive-tome skill and synchronizes later level changes', () => {
    expect(
      calculateInheritedAbilityDiff(
        [
          { name: 'bristleback_bristleback', level: 3 },
          { name: 'axe_counter_helix', level: 1 },
        ],
        { bristleback_bristleback: 2 },
      ),
    ).toEqual({
      add: [{ name: 'axe_counter_helix', level: 1 }],
      update: [{ name: 'bristleback_bristleback', level: 3 }],
      remove: [],
    });
  });

  it('never removes abilities that are not in the awakening ledger', () => {
    expect(calculateInheritedAbilityDiff([], {})).toEqual({ add: [], update: [], remove: [] });
  });

  it('repairs an inherited skill that is missing from the bear', () => {
    expect(
      calculateInheritedAbilityDiff(
        [{ name: 'axe_berserkers_call', level: 3 }],
        { axe_berserkers_call: 3 },
        { axe_berserkers_call: undefined },
      ),
    ).toEqual({
      add: [],
      update: [{ name: 'axe_berserkers_call', level: 3 }],
      remove: [],
    });
  });

  it('repairs an inherited skill whose bear level was changed externally', () => {
    expect(
      calculateInheritedAbilityDiff(
        [{ name: 'axe_berserkers_call', level: 3 }],
        { axe_berserkers_call: 3 },
        { axe_berserkers_call: 1 },
      ),
    ).toEqual({
      add: [],
      update: [{ name: 'axe_berserkers_call', level: 3 }],
      remove: [],
    });
  });
});

describe('calculateBonusSkillPointCount', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 1],
    [7, 3],
    [8, 4],
  ])('converts active property level %s into %s inherited points', (activeLevel, expected) => {
    expect(calculateBonusSkillPointCount(activeLevel)).toBe(expected);
  });
});

describe('buildInheritedAbilityRuntimeSignature', () => {
  const desired = [{ name: 'axe_berserkers_call', level: 3 }];

  it('changes when a desired bear skill disappears', () => {
    expect(buildInheritedAbilityRuntimeSignature(desired, { axe_berserkers_call: 3 })).not.toBe(
      buildInheritedAbilityRuntimeSignature(desired, { axe_berserkers_call: undefined }),
    );
  });
});

describe('buildLoneDruidBearInheritanceSignature', () => {
  const properties = [
    { name: 'property_stats_strength_bonus', level: 8 },
    { name: 'property_skill_points_bonus', level: 8 },
  ];
  const abilities = [
    { name: 'axe_berserkers_call', level: 3 },
    { name: 'bristleback_bristleback', level: 2 },
  ];

  it('is stable when input order changes', () => {
    expect(buildLoneDruidBearInheritanceSignature(30, properties, abilities, 4)).toBe(
      buildLoneDruidBearInheritanceSignature(
        30,
        [...properties].reverse(),
        [...abilities].reverse(),
        4,
      ),
    );
  });

  it('changes when an inherited level changes', () => {
    expect(buildLoneDruidBearInheritanceSignature(30, properties, abilities, 4)).not.toBe(
      buildLoneDruidBearInheritanceSignature(
        30,
        properties,
        [{ name: 'axe_berserkers_call', level: 4 }, abilities[1]],
        4,
      ),
    );
  });
});

describe('isOwnedLoneDruidSpiritBearCandidate', () => {
  const owned = {
    unitName: 'npc_dota_lone_druid_bear1',
    ownerEntityIndex: 100,
    ownerIsBaseNpc: true,
    druidEntityIndex: 100,
    unitPlayerOwnerId: 2,
    druidPlayerOwnerId: 2,
    unitTeam: 2,
    druidTeam: 2,
  };

  it.each([
    'npc_dota_lone_druid_bear1',
    'npc_dota_lone_druid_bear2',
    'npc_dota_lone_druid_bear3',
    'npc_dota_lone_druid_bear4',
  ])('accepts an owned spirit bear variant: %s', (unitName) => {
    expect(isOwnedLoneDruidSpiritBearCandidate({ ...owned, unitName })).toBe(true);
  });

  it('accepts the real runtime shape where GetOwnerEntity returns the player entity', () => {
    expect(
      isOwnedLoneDruidSpiritBearCandidate({
        ...owned,
        ownerEntityIndex: 1,
        ownerIsBaseNpc: false,
      }),
    ).toBe(true);
  });

  it('rejects a bear owned by another Druid', () => {
    expect(isOwnedLoneDruidSpiritBearCandidate({ ...owned, ownerEntityIndex: 200 })).toBe(false);
  });

  it('rejects unrelated summons', () => {
    expect(
      isOwnedLoneDruidSpiritBearCandidate({ ...owned, unitName: 'npc_dota_warlock_golem_1' }),
    ).toBe(false);
  });
});
