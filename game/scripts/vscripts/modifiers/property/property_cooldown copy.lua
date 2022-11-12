local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__Decorate = ____lualib.__TS__Decorate
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 1,["9"] = 1,["10"] = 1,["11"] = 3,["12"] = 4,["13"] = 3,["14"] = 4,["15"] = 7,["16"] = 8,["17"] = 7,["18"] = 10,["19"] = 11,["20"] = 10,["21"] = 13,["22"] = 14,["23"] = 13,["24"] = 17,["25"] = 18,["28"] = 20,["29"] = 20,["30"] = 20,["31"] = 20,["32"] = 22,["33"] = 23,["34"] = 17,["35"] = 27,["36"] = 28,["37"] = 27,["38"] = 33,["39"] = 34,["40"] = 33,["41"] = 38,["42"] = 39,["43"] = 38,["44"] = 41,["45"] = 42,["46"] = 41,["47"] = 4,["48"] = 3,["49"] = 4,["51"] = 4});
local ____exports = {}
local ____dota_ts_adapter = require("lib.dota_ts_adapter")
local BaseModifier = ____dota_ts_adapter.BaseModifier
local registerModifier = ____dota_ts_adapter.registerModifier
____exports.ModifierPropertyCooldown = __TS__Class()
local ModifierPropertyCooldown = ____exports.ModifierPropertyCooldown
ModifierPropertyCooldown.name = "ModifierPropertyCooldown"
__TS__ClassExtends(ModifierPropertyCooldown, BaseModifier)
function ModifierPropertyCooldown.prototype.IsPurgable(self)
    return false
end
function ModifierPropertyCooldown.prototype.RemoveOnDeath(self)
    return false
end
function ModifierPropertyCooldown.prototype.IsHidden(self)
    return true
end
function ModifierPropertyCooldown.prototype.OnCreated(self, kv)
    if IsClient() then
        return
    end
    TsPrint(
        nil,
        (self:GetClass() .. " Created with value: ") .. tostring(kv.value)
    )
    self.value = kv.value
    self:SetHasCustomTransmitterData(true)
end
function ModifierPropertyCooldown.prototype.AddCustomTransmitterData(self)
    return {value = self.value}
end
function ModifierPropertyCooldown.prototype.HandleCustomTransmitterData(self, data)
    self.value = data.value
end
function ModifierPropertyCooldown.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE}
end
function ModifierPropertyCooldown.prototype.GetModifierPercentageCooldown(self)
    return self.value
end
ModifierPropertyCooldown = __TS__Decorate(
    {registerModifier(nil)},
    ModifierPropertyCooldown
)
____exports.ModifierPropertyCooldown = ModifierPropertyCooldown
return ____exports
