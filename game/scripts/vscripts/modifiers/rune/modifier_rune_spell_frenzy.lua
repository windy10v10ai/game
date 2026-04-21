local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__DecorateLegacy = ____lualib.__TS__DecorateLegacy
local ____exports = {}
local ____dota_ts_adapter = require("utils.dota_ts_adapter")
local BaseModifier = ____dota_ts_adapter.BaseModifier
local registerModifier = ____dota_ts_adapter.registerModifier
LinkLuaModifier("modifier_rune_spell_frenzy", "modifiers/rune/modifier_rune_spell_frenzy", LUA_MODIFIER_MOTION_NONE)
____exports.SPELL_FRENZY_DURATION = 15
____exports.SPELL_FRENZY_CDR_PCT = 80
____exports.modifier_rune_spell_frenzy = __TS__Class()
local modifier_rune_spell_frenzy = ____exports.modifier_rune_spell_frenzy
modifier_rune_spell_frenzy.name = "modifier_rune_spell_frenzy"
__TS__ClassExtends(modifier_rune_spell_frenzy, BaseModifier)
function modifier_rune_spell_frenzy.prototype.IsHidden(self)
    return false
end
function modifier_rune_spell_frenzy.prototype.IsPurgable(self)
    return false
end
function modifier_rune_spell_frenzy.prototype.IsDebuff(self)
    return false
end
function modifier_rune_spell_frenzy.prototype.GetEffectName(self)
    return "particles/items2_fx/arcane_rune.vpcf"
end
function modifier_rune_spell_frenzy.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE}
end
function modifier_rune_spell_frenzy.prototype.GetModifierPercentageCooldown(self)
    return ____exports.SPELL_FRENZY_CDR_PCT
end
modifier_rune_spell_frenzy = __TS__DecorateLegacy(
    {registerModifier(nil, "modifiers/rune/modifier_rune_spell_frenzy")},
    modifier_rune_spell_frenzy
)
____exports.modifier_rune_spell_frenzy = modifier_rune_spell_frenzy
return ____exports
