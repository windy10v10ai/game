import { ABILITY_REPLACEMENTS, FREE_TRIAL_HEROES, getAwakenHeroNames } from './awaken-config';

describe('Abaddon awakening configuration', () => {
  it('grants only the scripted Quickening awakening ability', () => {
    const replacements = ABILITY_REPLACEMENTS.filter(
      ({ heroName }) => heroName === 'npc_dota_hero_abaddon',
    );

    expect(replacements).toEqual([
      {
        heroName: 'npc_dota_hero_abaddon',
        newAbility: 'special_bonus_unique_abaddon_quickening_awaken',
        newLevel: 1,
      },
    ]);

    expect(
      getAwakenHeroNames().filter((heroName) => heroName === 'npc_dota_hero_abaddon'),
    ).toHaveLength(1);
  });

  it('requires unlocking instead of granting free trial access', () => {
    expect(FREE_TRIAL_HEROES).not.toContain('npc_dota_hero_abaddon');
  });
});
