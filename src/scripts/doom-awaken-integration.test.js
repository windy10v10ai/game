const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function extractKvBlock(source, name) {
  const marker = `"${name}"`;
  const definitionPattern = new RegExp(`^\\s*${marker}\\s*\\r?\\n\\s*\\{`, 'm');
  const definition = definitionPattern.exec(source);
  if (!definition) throw new Error(`KV block not found: ${name}`);

  const markerIndex = definition.index + definition[0].indexOf(marker);
  const openingBrace = source.indexOf('{', markerIndex + marker.length);
  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(markerIndex, index + 1);
    }
  }
  throw new Error(`KV block has no closing brace: ${name}`);
}

describe('Doom awakened integration', () => {
  it('defines the four-level awakened ability with current project Doom values', () => {
    const kv = read('game/scripts/npc/npc_abilities_custom_awaken.txt');
    const block = extractKvBlock(kv, 'doom_bringer_doom_awakened');
    expect(block).toMatch(/"ScriptFile"\s+"abilities\/ts_abilities\/doom_bringer_doom_awakened"/);
    expect(block).toMatch(/"MaxLevel"\s+"4"/);
    expect(block).toMatch(/"AbilityManaCost"\s+"150 200 250 300"/);
    expect(block).toMatch(/"AbilityCooldown"\s+"60"/);
    expect(block).toMatch(/"duration"\s+"12 14 16 18"/);
    expect(block).toMatch(/"damage"\s+"66 132 198 264"/);
    expect(block).toMatch(/"HasScepterUpgrade"\s+"1"/);
    expect(block).toMatch(/"aoe_bonus_probe"[\s\S]*?"affected_by_aoe_increase"\s+"1"/);
    expect(block).not.toMatch(/scepter_radius/);
  });

  it('replaces native Doom in awakening, Tier 4 and the awaken preview', () => {
    const awaken = read('src/vscripts/modules/awaken/awaken-config.ts');
    const pool = read('src/vscripts/modules/lottery/ability/lottery-abilities.ts');
    const ui = read('src/panorama/react/hud_main/pages/profile/tabs/AwakenTab.tsx');
    const ability = read('src/vscripts/abilities/ts_abilities/doom_bringer_doom_awakened.ts');

    expect(awaken).toMatch(
      /heroName: 'npc_dota_hero_doom_bringer',[\s\S]*?targetAbility: 'doom_bringer_doom',[\s\S]*?newAbility: 'doom_bringer_doom_awakened',[\s\S]*?newLevel: 0/,
    );
    expect(pool).toContain("'doom_bringer_doom_awakened', // 末日");
    expect(pool).not.toContain("'doom_bringer_doom', // 末日");
    expect(ui).toMatch(
      /heroName: 'npc_dota_hero_doom_bringer',[\s\S]*?abilityName: 'doom_bringer_doom_awakened'/,
    );
    expect(ability).toContain("GetAbilityKeyValuesByName('doom_bringer_doom')");
    expect(ability).toContain('getDoomAwakenedNativeScepterRadius');
    expect(ability).toContain("this.GetSpecialValueFor('aoe_bonus_probe')");
  });

  it('keeps the old multicast blacklist and special-cases only awakened Doom', () => {
    const multicast = read('game/scripts/vscripts/abilities/ogre_magi_multicast_lua.lua');
    expect(multicast).toMatch(/doom_bringer_doom\s*=\s*1/);
    expect(multicast).not.toMatch(/doom_bringer_doom_awakened\s*=\s*1/);
    expect(multicast).toContain('FindAwakenedDoomMulticastTargets');
    expect(multicast).toContain('local AWAKENED_DOOM_ABILITY = "doom_bringer_doom_awakened"');
    expect(multicast).toContain('abilityName == AWAKENED_DOOM_ABILITY');
    expect(multicast).toContain('keys.unit:HasScepter()');
  });

  it('adds an isolated Scepter-aware butterfly target helper', () => {
    const butterfly = read('game/scripts/vscripts/abilities/ability_trigger_on_active.lua');
    expect(butterfly).toContain('FindAwakenedDoomButterflyTargets');
    expect(butterfly).toContain('local AWAKENED_DOOM_ABILITY = "doom_bringer_doom_awakened"');
    expect(butterfly).toContain('ability_name == AWAKENED_DOOM_ABILITY');
    expect(butterfly).toContain('self.caster:HasScepter()');
    expect(butterfly).toContain(
      'ability:GetAbilityTargetFlags() + DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE',
    );
  });

  it('adds a hidden awakened Devour passive without replacing native Devour', () => {
    const awaken = read('src/vscripts/modules/awaken/awaken-config.ts');
    const kv = read('game/scripts/npc/npc_abilities_custom_awaken.txt');
    const multicast = read('game/scripts/vscripts/abilities/ogre_magi_multicast_lua.lua');
    const butterflyBlacklist = read(
      'game/scripts/vscripts/abilities/ability_blacklist_butterfly.lua',
    );
    const block = extractKvBlock(kv, 'doom_bringer_devour_awakened');

    expect(awaken).toMatch(
      /heroName: 'npc_dota_hero_doom_bringer',[\s\S]*?newAbility: 'doom_bringer_devour_awakened',[\s\S]*?newLevel: 1/,
    );
    expect(block).toMatch(/"ScriptFile"\s+"abilities\/ts_abilities\/doom_bringer_devour_awakened"/);
    expect(block).toMatch(/"MaxLevel"\s+"1"/);
    expect(block).toMatch(/DOTA_ABILITY_BEHAVIOR_PASSIVE/);
    expect(block).toMatch(/DOTA_ABILITY_BEHAVIOR_HIDDEN/);
    expect(awaken).not.toContain("targetAbility: 'doom_bringer_devour'");
    expect(multicast).toMatch(/doom_bringer_devour\s*=\s*1/);
    expect(butterflyBlacklist).toContain('["doom_bringer_devour"] = true');
  });
  it.each([
    ['addon_schinese.txt', '觉醒后，吞噬获得的野怪技能会持续校正到最大等级。'],
    [
      'addon_english.txt',
      'After awakening, neutral-creep abilities gained through Devour are continuously corrected to their maximum level.',
    ],
    [
      'addon_russian.txt',
      'После пробуждения способности нейтральных крипов, полученные с помощью Devour, постоянно корректируются до максимального уровня.',
    ],
  ])('describes awakened Devour in %s', (fileName, expectedText) => {
    expect(read(`game/resource/${fileName}`)).toContain(expectedText);
  });
  it.each(['addon_schinese.txt', 'addon_english.txt', 'addon_russian.txt'])(
    'contains awakened Doom tooltip keys in %s',
    (fileName) => {
      const localization = read(`game/resource/${fileName}`);
      expect(localization).toContain('DOTA_Tooltip_ability_doom_bringer_doom_awakened');
      expect(localization).toContain('DOTA_Tooltip_ability_doom_bringer_doom_awakened_Description');
      expect(localization).toContain('DOTA_Tooltip_ability_doom_bringer_doom_awakened_damage');
      expect(localization).toContain('DOTA_Tooltip_modifier_doom_bringer_doom_awakened_carrier');
      expect(localization).toContain(
        'DOTA_Tooltip_modifier_doom_bringer_doom_awakened_carrier_Description',
      );
    },
  );

  it('continuously enforces maximum level on abilities from the latest Devour target', () => {
    const devour = read('src/vscripts/abilities/ts_abilities/doom_bringer_devour_awakened.ts');

    expect(devour).toContain('selectTrackedDevourAbilityEntityIndexes');
    expect(devour).toContain('OnIntervalThink(): void');
    expect(devour).toContain('this.StartIntervalThink(DEVOUR_LEVEL_INTERVAL)');
    expect(devour).not.toContain('RETRY_DELAY');
    expect(devour).toContain('getDevourAbilityHighestDeclaredLevel');
    expect(devour).toContain('GetAbilityKeyValuesByName(grantedAbility.GetAbilityName())');
  });

  it('shows an area particle and forwards Doom Mute/Break talents to every doomed enemy', () => {
    const ability = read('src/vscripts/abilities/ts_abilities/doom_bringer_doom_awakened.ts');

    expect(ability).toContain('modifier_doom_bringer_doom_awakened_states');
    expect(ability).toContain('special_bonus_unique_doom_10');
    expect(ability).toContain('special_bonus_unique_doom_11');
    expect(ability).toContain('[ModifierState.MUTED]');
    expect(ability).toContain('[ModifierState.PASSIVES_DISABLED]');
    expect(ability).toContain(
      'particles/units/heroes/hero_doom_bringer/doom_bringer_doom_aura.vpcf',
    );
    expect(ability).toContain('ParticleManager.CreateParticle');
    expect(ability).toContain('ParticleManager.SetParticleControl');
    expect(ability).toContain('Vector(this.radius, this.radius, this.radius)');
  });

  it.each(['addon_schinese.txt', 'addon_english.txt', 'addon_russian.txt'])(
    'contains awakened Doom Scepter tooltip keys in %s',
    (fileName) => {
      const localization = read(`game/resource/${fileName}`);
      expect(localization).toContain(
        'DOTA_Tooltip_ability_doom_bringer_doom_awakened_scepter_description',
      );
      expect(localization).toContain(
        'DOTA_Tooltip_ability_doom_bringer_doom_awakened_scepter_duration',
      );
    },
  );
});
