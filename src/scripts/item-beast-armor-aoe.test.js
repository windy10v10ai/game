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
  if (!definition) {
    throw new Error(`KV block not found: ${name}`);
  }

  const markerIndex = definition.index + definition[0].indexOf(marker);
  const openingBrace = source.indexOf('{', markerIndex + marker.length);
  if (openingBrace < 0) {
    throw new Error(`KV block has no opening brace: ${name}`);
  }

  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    } else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(markerIndex, index + 1);
      }
    }
  }

  throw new Error(`KV block has no closing brace: ${name}`);
}

describe('item_beast_armor AoE inheritance', () => {
  const customItems = read('game/scripts/npc/npc_items_custom.txt');
  const clonedItems = read('game/scripts/npc/npc_items_clone.txt');
  const beastArmorLua = read('game/scripts/vscripts/items/item_beast_armor.lua');
  const beastArmorBlock = extractKvBlock(customItems, 'item_beast_armor');
  const shivasGuardBlock = extractKvBlock(clonedItems, 'item_shivas_guard_2');

  it('strengthens Beast Armor to +300 while leaving Shiva Guard 2 at +150', () => {
    expect(beastArmorBlock).toMatch(/"bonus_aoe"\s+"300"/);
    expect(shivasGuardBlock).toMatch(/"bonus_aoe"\s+"150"/);
  });

  it('exposes the AoE bonus through the existing Lua passive modifier', () => {
    expect(beastArmorLua).toContain('self.bonus_aoe = ability:GetSpecialValueFor("bonus_aoe")');
    expect(beastArmorLua).toContain('MODIFIER_PROPERTY_AOE_BONUS_CONSTANT_STACKING');
    expect(beastArmorLua).toMatch(
      /function modifier_item_beast_armor_passive:GetModifierAoEBonusConstantStacking\(\)[\s\S]*?return self\.bonus_aoe or 0[\s\S]*?end/,
    );
  });

  it.each(['addon_schinese.txt', 'addon_english.txt', 'addon_russian.txt'])(
    'shows the AoE bonus in %s',
    (fileName) => {
      const localization = read(`game/resource/${fileName}`);
      expect(localization).toMatch(
        /"DOTA_Tooltip_ability_item_beast_armor_bonus_aoe"\s+"\+\$aoe_bonus"/,
      );
    },
  );
});
