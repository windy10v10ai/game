import {
  getDevourAbilityHighestDeclaredLevel,
  getUniqueDevourAbilityNames,
  selectTrackedDevourAbilityEntityIndexes,
} from './doom-devour-awaken-logic';

describe('Doom awakened Devour grant tracking', () => {
  it('deduplicates captured creep ability names and drops empty slots', () => {
    expect(
      getUniqueDevourAbilityNames([
        'centaur_khan_war_stomp',
        '',
        'centaur_khan_war_stomp',
        'centaur_khan_endurance_aura',
      ]),
    ).toEqual(['centaur_khan_war_stomp', 'centaur_khan_endurance_aura']);
  });

  it('selects every current ability whose name belongs to the latest Devour target', () => {
    expect(
      selectTrackedDevourAbilityEntityIndexes(
        ['centaur_khan_war_stomp', 'centaur_khan_endurance_aura'],
        [
          { name: 'lottery_spell', entityIndex: 10 },
          { name: 'centaur_khan_war_stomp', entityIndex: 21 },
          { name: 'centaur_khan_endurance_aura', entityIndex: 22 },
        ],
      ),
    ).toEqual([21, 22]);
  });

  it('keeps selecting a same-name ability even when Devour reuses its existing handle', () => {
    expect(
      selectTrackedDevourAbilityEntityIndexes(
        ['ogre_bruiser_ogre_smash'],
        [{ name: 'ogre_bruiser_ogre_smash', entityIndex: 40 }],
      ),
    ).toEqual([40]);
  });

  it('deduplicates entity indexes and ignores unrelated abilities', () => {
    expect(
      selectTrackedDevourAbilityEntityIndexes(
        ['satyr_hellcaller_shockwave'],
        [
          { name: 'satyr_hellcaller_shockwave', entityIndex: 50 },
          { name: 'satyr_hellcaller_shockwave', entityIndex: 50 },
          { name: 'unrelated_new_spell', entityIndex: 51 },
        ],
      ),
    ).toEqual([50]);
  });
});

describe('getDevourAbilityHighestDeclaredLevel', () => {
  it('uses the longest declared AbilityValues level list when native MaxLevel is only one', () => {
    expect(
      getDevourAbilityHighestDeclaredLevel({
        MaxLevel: '1',
        AbilityValues: {
          magic_resistance: {
            value: '10 12 14 16',
          },
          aura_radius: '1200',
        },
      }),
    ).toBe(4);
  });

  it('keeps the declared MaxLevel when it is already higher than the special-value lists', () => {
    expect(
      getDevourAbilityHighestDeclaredLevel({
        MaxLevel: 5,
        AbilityValues: {
          damage: '80 95 110 125',
        },
      }),
    ).toBe(5);
  });

  it('falls back to one for missing or malformed native KV', () => {
    expect(getDevourAbilityHighestDeclaredLevel(undefined)).toBe(1);
    expect(getDevourAbilityHighestDeclaredLevel({ MaxLevel: 'bad' })).toBe(1);
  });
});
