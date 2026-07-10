declare function require(moduleName: string): any;
declare const __dirname: string;

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

describe('swift glove mjollnir inheritance', () => {
  it('uses a custom boosted chain lightning passive without the mjollnir active shield modifier', () => {
    const swiftGloveLua = fs.readFileSync(
      path.join(projectRoot, 'game/scripts/vscripts/items/item_swift_glove.lua'),
      'utf8',
    );
    const itemKv = fs.readFileSync(path.join(projectRoot, 'game/scripts/npc/npc_items_custom.txt'), 'utf8');

    expect(swiftGloveLua).toContain('modifier_item_swift_glove_chain_lightning');
    expect(swiftGloveLua).not.toContain('modifier_item_mjollnir_static');
    expect(swiftGloveLua).toContain('self.chain_chance = ability:GetSpecialValueFor("chain_chance")');
    expect(swiftGloveLua).toContain('self.chain_damage = ability:GetSpecialValueFor("chain_damage")');
    expect(swiftGloveLua).toContain('self.chain_strikes = ability:GetSpecialValueFor("chain_strikes")');
    expect(swiftGloveLua).toContain('self.chain_radius = ability:GetSpecialValueFor("chain_radius")');
    expect(swiftGloveLua).toContain('self.chain_cooldown = ability:GetSpecialValueFor("chain_cooldown")');
    expect(swiftGloveLua).toContain('self.double_damage_multiplier = ability:GetSpecialValueFor("double_damage_multiplier")');
    expect(itemKv).toContain('"chain_chance"		"75"');
    expect(itemKv).toContain('"chain_damage"		"700"');
    expect(itemKv).toContain('"chain_strikes"		"15"');
    expect(itemKv).toContain('"chain_radius"		"1400"');
    expect(itemKv).toContain('"double_damage_chance"	"20"');
    expect(itemKv).toContain('"quintuple_damage_chance"	"3"');
    expect(itemKv).toContain('"decuple_damage_chance"	"0.1"');
    expect(itemKv).toContain('"double_damage_cooldown"	"0.2"');
    expect(itemKv).toContain('"quintuple_damage_cooldown"	"0.5"');
    expect(itemKv).toContain('"decuple_damage_cooldown"	"1"');
    expect(swiftGloveLua).not.toContain('ability.added_modifiers.mjollnir =');
    expect(swiftGloveLua).not.toContain('added_modifiers.mjollnir_static');
  });

  it('uses a compiled chain lightning visual and mjollnir-like sound effects', () => {
    const swiftGloveLua = fs.readFileSync(
      path.join(projectRoot, 'game/scripts/vscripts/items/item_swift_glove.lua'),
      'utf8',
    );
    const itemKv = fs.readFileSync(path.join(projectRoot, 'game/scripts/npc/npc_items_custom.txt'), 'utf8');

    expect(swiftGloveLua).toContain('particles/items_fx/chain_lightning.vpcf');
    expect(swiftGloveLua).not.toContain('particles/items2_fx/maelstrom.vpcf');
    expect(itemKv).toContain('"particle"	"particles/items_fx/chain_lightning.vpcf"');
    expect(swiftGloveLua).toContain('ParticleManager:CreateParticle');
    expect(swiftGloveLua).toContain('ParticleManager:SetParticleControlEnt');
    expect(swiftGloveLua).toContain('ParticleManager:ReleaseParticleIndex');
    expect(swiftGloveLua).toContain('Item.Maelstrom.Chain_Lightning');
  });

  it('documents boosted chain lightning in the item tooltip', () => {
    const schinese = fs.readFileSync(path.join(projectRoot, 'game/resource/addon_schinese.txt'), 'utf8');
    const english = fs.readFileSync(path.join(projectRoot, 'game/resource/addon_english.txt'), 'utf8');
    const itemKv = fs.readFileSync(path.join(projectRoot, 'game/scripts/npc/npc_items_custom.txt'), 'utf8');

    expect(schinese).toContain('被动：强化连环闪电');
    expect(schinese).toContain('攻击有%chain_chance%%%几率释放一道强化连环闪电');
    expect(schinese).toContain('在%chain_radius%范围内%chain_strikes%个目标之间跳跃');
    expect(schinese).toContain('每次造成%chain_damage%点魔法伤害');
    expect(schinese).toContain('触发闪电时无视闪避，并且吃技能增强');
    expect(schinese).toContain('有%double_damage_chance%%%几率造成%double_damage_multiplier%倍伤害');
    expect(schinese).toContain('%quintuple_damage_chance%%%几率造成%quintuple_damage_multiplier%倍伤害');
    expect(schinese).toContain('%decuple_damage_chance%%%几率造成%decuple_damage_multiplier%倍伤害');
    expect(schinese).toContain('对应冷却时间为%double_damage_cooldown%秒，%quintuple_damage_cooldown%秒，%decuple_damage_cooldown%秒');
    expect(english).toContain('Passive: Empowered Chain Lightning');
    expect(english).toContain('Grants a %chain_chance%%% chance on attack to release an empowered bolt of electricity');
    expect(english).toContain('leaps between %chain_strikes% targets within a %chain_radius% radius');
    expect(english).toContain('dealing %chain_damage% magical damage to each');
    expect(english).toContain('Lightning proc pierces evasion and benefits from spell amplification');
    expect(english).toContain('has a %double_damage_chance%%% chance to deal %double_damage_multiplier%x damage');
    expect(english).toContain('%quintuple_damage_chance%%% chance to deal %quintuple_damage_multiplier%x damage');
    expect(english).toContain('%decuple_damage_chance%%% chance to deal %decuple_damage_multiplier%x damage');
    expect(english).toContain('The matching cooldowns are %double_damage_cooldown%s, %quintuple_damage_cooldown%s, and %decuple_damage_cooldown%s');
    expect(itemKv).toContain('"chain_chance"');
    expect(itemKv).toContain('"chain_damage"');
    expect(itemKv).toContain('"double_damage_multiplier"');
  });
});
