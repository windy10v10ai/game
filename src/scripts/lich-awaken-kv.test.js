const { readFileSync } = require('fs');

function abilityBlock(content, abilityName) {
  const escapedName = abilityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const definition = new RegExp(`^\\s*"${escapedName}"\\s*\\r?\\n\\s*\\{`, 'm').exec(content);
  if (!definition) throw new Error(`Ability not found: ${abilityName}`);
  const start = definition.index;
  const open = content.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < content.length; index += 1) {
    if (content[index] === '{') depth += 1;
    if (content[index] === '}') {
      depth -= 1;
      if (depth === 0) return content.slice(start, index + 1);
    }
  }
  throw new Error(`Unclosed ability block: ${abilityName}`);
}

describe('Lich Chain Frost bounce talent KV', () => {
  it('adds 100 bounces to both native and awakened Chain Frost', () => {
    const nativeKv = readFileSync('game/scripts/npc/npc_abilities_override.txt', 'utf8');
    const awakenedKv = readFileSync('game/scripts/npc/npc_abilities_custom_awaken.txt', 'utf8');

    const nativeChainFrost = abilityBlock(nativeKv, 'lich_chain_frost');
    expect(nativeChainFrost).toMatch(/"jumps"\s*\{\s*"value"\s*"30 35 40 45"/);
    expect(nativeChainFrost).toMatch(/"special_bonus_unique_lich_5"\s*"\+100"/);
    const bounceTalent = abilityBlock(nativeKv, 'special_bonus_unique_lich_5');
    expect(bounceTalent).toMatch(/"BaseClass"\s*"special_bonus_base"/);
    expect(bounceTalent).toMatch(/"AbilityType"\s*"ABILITY_TYPE_ATTRIBUTES"/);
    expect(bounceTalent).toMatch(/"AbilityBehavior"\s*"DOTA_ABILITY_BEHAVIOR_PASSIVE"/);
    expect(bounceTalent).toMatch(/"bonus_jumps"\s*"100"/);
    expect(abilityBlock(awakenedKv, 'lich_chain_frost_awakened')).toMatch(
      /"jumps"\s*\{\s*"value"\s*"30 35 40 45"\s*"special_bonus_unique_lich_5"\s*"\+100"\s*\}/,
    );
  });
});
