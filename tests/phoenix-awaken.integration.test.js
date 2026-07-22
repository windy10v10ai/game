const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const abilityName = 'special_bonus_unique_phoenix_upgrade';

describe('Phoenix Hotspot awakening integration', () => {
  test('server awaken config grants the hidden Phoenix upgrade at level 1', () => {
    const config = read('src/vscripts/modules/awaken/awaken-config.ts');
    expect(config).toMatch(
      /heroName:\s*'npc_dota_hero_phoenix',[\s\S]*?newAbility:\s*'special_bonus_unique_phoenix_upgrade',[\s\S]*?newLevel:\s*1/,
    );
  });

  test('Awaken UI previews the same Phoenix upgrade ability', () => {
    const ui = read('src/panorama/react/hud_main/pages/profile/tabs/AwakenTab.tsx');
    expect(ui).toMatch(
      /heroName:\s*'npc_dota_hero_phoenix',[\s\S]*?abilityName:\s*'special_bonus_unique_phoenix_upgrade'/,
    );
  });

  test('hidden awakening ability exposes the Sun Ray icon and tooltip values', () => {
    const abilities = read('game/scripts/npc/npc_abilities_custom_awaken.txt');
    expect(abilities).toContain(`"${abilityName}"`);
    expect(abilities).toContain('"AbilityTextureName"\t\t\t"phoenix_sun_ray"');
    expect(abilities).toContain('"hotspot_start_length_pct"\t"50"');
    expect(abilities).toContain('"hotspot_end_multiplier_pct"\t"200"');
    expect(abilities).toContain('"hotspot_reference_length"\t"1200"');
    expect(abilities).toContain(`"modifier_${abilityName}"`);
    expect(abilities).toContain('"Passive"\t\t\t"1"');
    expect(abilities).toContain('"IsHidden"\t\t\t"0"');
    expect(abilities).toContain('"IsPurgable"\t\t"0"');
    expect(abilities).toContain('"RemoveOnDeath"\t\t"0"');
    expect(abilities).toContain('"Attributes"\t\t"MODIFIER_ATTRIBUTE_PERMANENT"');
  });

  test('Sun Ray enables the native focal-point fields only through the awakening ability', () => {
    const overrides = read('game/scripts/npc/npc_abilities_override.txt');
    for (const expected of [
      '"focal_point_max_multiplier"',
      '"focal_point_start_length_pct"',
      '"focal_point_full_length_tooltip_only"',
      `"${abilityName}"\t"=2.0"`,
      `"${abilityName}"\t"=50"`,
      `"${abilityName}"\t"=1200"`,
    ]) {
      expect(overrides).toContain(expected);
    }
  });

  test('Chinese, English, and Russian names identify the ability as awakened', () => {
    const zh = read('game/resource/addon_schinese.txt');
    const en = read('game/resource/addon_english.txt');
    const ru = read('game/resource/addon_russian.txt');

    for (const localization of [zh, en, ru]) {
      expect(localization).toContain(`"DOTA_Tooltip_ability_${abilityName}"`);
      expect(localization).toContain(`"DOTA_Tooltip_modifier_${abilityName}"`);
      expect(localization).toContain('50%%');
      expect(localization).toContain('1200');
      expect(localization).toContain('200%%');
    }
    expect(zh).toContain('烈日炙烤 觉醒');
    expect(en).toContain('Sun Ray Awakened');
    expect(ru).toContain('Пробуждение');
  });
});
