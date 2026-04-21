local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__DecorateLegacy = ____lualib.__TS__DecorateLegacy
local ____exports = {}
local ____dota_ts_adapter = require("utils.dota_ts_adapter")
local BaseModifier = ____dota_ts_adapter.BaseModifier
local registerModifier = ____dota_ts_adapter.registerModifier
LinkLuaModifier("modifier_rune_critical_storm", "modifiers/rune/modifier_rune_critical_storm", LUA_MODIFIER_MOTION_NONE)
____exports.CRITICAL_STORM_DURATION = 15
____exports.CRITICAL_STORM_BONUS_DAMAGE_PCT = 400
____exports.modifier_rune_critical_storm = __TS__Class()
local modifier_rune_critical_storm = ____exports.modifier_rune_critical_storm
modifier_rune_critical_storm.name = "modifier_rune_critical_storm"
__TS__ClassExtends(modifier_rune_critical_storm, BaseModifier)
function modifier_rune_critical_storm.prototype.IsHidden(self)
    return false
end
function modifier_rune_critical_storm.prototype.IsPurgable(self)
    return false
end
function modifier_rune_critical_storm.prototype.IsDebuff(self)
    return false
end
function modifier_rune_critical_storm.prototype.GetEffectName(self)
    return "particles/items2_fx/double_damage.vpcf"
end
function modifier_rune_critical_storm.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE}
end
function modifier_rune_critical_storm.prototype.GetModifierPreAttack_CriticalStrike(self)
    return ____exports.CRITICAL_STORM_BONUS_DAMAGE_PCT
end
modifier_rune_critical_storm = __TS__DecorateLegacy(
    {registerModifier(nil, "modifiers/rune/modifier_rune_critical_storm")},
    modifier_rune_critical_storm
)
____exports.modifier_rune_critical_storm = modifier_rune_critical_storm
return ____exports
