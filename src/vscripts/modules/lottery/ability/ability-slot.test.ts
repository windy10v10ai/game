import {
  addAbilityToDynamicSlot,
  moveAbilityToDynamicSlot,
  resolveDynamicAbilityTargetIndex,
} from './ability-slot';

describe('resolveDynamicAbilityTargetIndex', () => {
  const abilities = [
    { name: 'lone_druid_spirit_bear', index: 0 },
    { name: 'lone_druid_spirit_link', index: 1 },
    { name: 'special_bonus_unique_lone_druid_1', index: 4 },
    { name: 'special_bonus_unique_lone_druid_2', index: 5 },
    { name: 'generic_hidden', index: 8 },
  ];

  it('reuses the removed skill slot for a reset-book replacement', () => {
    expect(resolveDynamicAbilityTargetIndex(abilities, 2)).toBe(2);
  });

  it('inserts a newly granted skill before the first talent', () => {
    expect(resolveDynamicAbilityTargetIndex(abilities)).toBe(4);
  });

  it('repairs a reset-book replacement whose previous slot was already behind talents', () => {
    expect(resolveDynamicAbilityTargetIndex(abilities, 8)).toBe(4);
  });

  it('appends when a unit has no talent abilities', () => {
    expect(
      resolveDynamicAbilityTargetIndex([
        { name: 'lone_druid_spirit_bear', index: 0 },
        { name: 'lone_druid_spirit_link', index: 2 },
      ]),
    ).toBe(3);
  });
});

describe('dynamic ability slot integration', () => {
  function createUnit(addedIndex: number) {
    const abilities = [
      { IsNull: () => false, GetAbilityName: () => 'lone_druid_spirit_bear' },
      { IsNull: () => false, GetAbilityName: () => 'special_bonus_unique_lone_druid_1' },
    ];
    const added = {
      IsNull: () => false,
      GetAbilityName: () => 'medusa_split_shot',
      GetAbilityIndex: jest.fn(() => addedIndex),
      SetAbilityIndex: jest.fn(),
    };
    const unit = {
      GetAbilityCount: () => 2,
      GetAbilityByIndex: (index: number) => abilities[index],
      AddAbility: jest.fn(() => added),
    };
    return {
      unit: unit as unknown as CDOTA_BaseNPC,
      added: added as unknown as CDOTABaseAbility,
      setAbilityIndex: added.SetAbilityIndex,
    };
  }

  it('places a passive-tome skill before talents', () => {
    const { unit, setAbilityIndex } = createUnit(2);

    addAbilityToDynamicSlot(unit, 'medusa_split_shot');

    expect(setAbilityIndex).toHaveBeenCalledWith(1);
  });

  it('places a reset-book replacement back into the removed slot', () => {
    const { unit, setAbilityIndex } = createUnit(2);

    addAbilityToDynamicSlot(unit, 'medusa_split_shot', 0);

    expect(setAbilityIndex).toHaveBeenCalledWith(0);
  });

  it('repairs an inherited bear skill that sits behind talents', () => {
    const { unit, added, setAbilityIndex } = createUnit(2);

    moveAbilityToDynamicSlot(unit, added);

    expect(setAbilityIndex).toHaveBeenCalledWith(1);
  });
});
