local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__Decorate = ____lualib.__TS__Decorate
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 1,["9"] = 1,["10"] = 1,["11"] = 3,["12"] = 4,["13"] = 3,["14"] = 4,["15"] = 5,["16"] = 6,["17"] = 5,["18"] = 9,["19"] = 10,["20"] = 9,["21"] = 13,["22"] = 14,["23"] = 13,["24"] = 17,["25"] = 18,["26"] = 17,["27"] = 21,["28"] = 22,["29"] = 21,["30"] = 25,["31"] = 26,["32"] = 25,["33"] = 29,["34"] = 30,["35"] = 29,["36"] = 33,["37"] = 34,["38"] = 35,["39"] = 33,["40"] = 4,["41"] = 3,["42"] = 4,["44"] = 4});
local ____exports = {}
local ____dota_ts_adapter = require("utils.dota_ts_adapter")
local BaseModifier = ____dota_ts_adapter.BaseModifier
local registerModifier = ____dota_ts_adapter.registerModifier
____exports.modifier_intelect_magic_resist = __TS__Class()
local modifier_intelect_magic_resist = ____exports.modifier_intelect_magic_resist
modifier_intelect_magic_resist.name = "modifier_intelect_magic_resist"
__TS__ClassExtends(modifier_intelect_magic_resist, BaseModifier)
function modifier_intelect_magic_resist.prototype.IsHidden(self)
    return true
end
function modifier_intelect_magic_resist.prototype.IsPurgable(self)
    return false
end
function modifier_intelect_magic_resist.prototype.IsPurgeException(self)
    return false
end
function modifier_intelect_magic_resist.prototype.IsDebuff(self)
    return false
end
function modifier_intelect_magic_resist.prototype.RemoveOnDeath(self)
    return false
end
function modifier_intelect_magic_resist.prototype.AllowIllusionDuplicate(self)
    return true
end
function modifier_intelect_magic_resist.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_MAGICAL_RESISTANCE_DIRECT_MODIFICATION}
end
function modifier_intelect_magic_resist.prototype.GetModifierMagicalResistanceDirectModification(self)
    local hero = self:GetParent()
    return hero:GetIntellect(true) * -0.05
end
modifier_intelect_magic_resist = __TS__Decorate(
    {registerModifier(nil)},
    modifier_intelect_magic_resist
)
____exports.modifier_intelect_magic_resist = modifier_intelect_magic_resist
return ____exports
