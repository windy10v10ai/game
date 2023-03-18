local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__Decorate = ____lualib.__TS__Decorate
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 1,["9"] = 1,["10"] = 1,["11"] = 3,["12"] = 4,["13"] = 3,["14"] = 4,["15"] = 7,["16"] = 8,["17"] = 7,["18"] = 10,["19"] = 11,["20"] = 10,["21"] = 13,["22"] = 14,["23"] = 13,["24"] = 17,["25"] = 18,["28"] = 19,["29"] = 19,["30"] = 19,["31"] = 19,["32"] = 21,["33"] = 22,["34"] = 17,["35"] = 26,["36"] = 27,["37"] = 26,["38"] = 32,["39"] = 33,["40"] = 32,["41"] = 4,["42"] = 3,["43"] = 4,["45"] = 4});
local ____exports = {}
local ____dota_ts_adapter = require("lib.dota_ts_adapter")
local BaseModifier = ____dota_ts_adapter.BaseModifier
local registerModifier = ____dota_ts_adapter.registerModifier
____exports.PropertyBaseModifier = __TS__Class()
local PropertyBaseModifier = ____exports.PropertyBaseModifier
PropertyBaseModifier.name = "PropertyBaseModifier"
__TS__ClassExtends(PropertyBaseModifier, BaseModifier)
function PropertyBaseModifier.prototype.IsPurgable(self)
    return false
end
function PropertyBaseModifier.prototype.RemoveOnDeath(self)
    return false
end
function PropertyBaseModifier.prototype.IsHidden(self)
    return true
end
function PropertyBaseModifier.prototype.OnCreated(self, kv)
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
function PropertyBaseModifier.prototype.AddCustomTransmitterData(self)
    return {value = self.value}
end
function PropertyBaseModifier.prototype.HandleCustomTransmitterData(self, data)
    self.value = data.value
end
PropertyBaseModifier = __TS__Decorate(
    {registerModifier(nil)},
    PropertyBaseModifier
)
____exports.PropertyBaseModifier = PropertyBaseModifier
return ____exports
