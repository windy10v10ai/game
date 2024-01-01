local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__Decorate = ____lualib.__TS__Decorate
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 1,["9"] = 1,["10"] = 1,["11"] = 3,["12"] = 4,["13"] = 3,["14"] = 4,["15"] = 7,["16"] = 8,["17"] = 7,["18"] = 11,["19"] = 12,["20"] = 11,["21"] = 15,["22"] = 16,["23"] = 15,["24"] = 19,["25"] = 20,["28"] = 22,["29"] = 23,["30"] = 19,["31"] = 26,["32"] = 27,["33"] = 26,["34"] = 32,["35"] = 33,["36"] = 32,["37"] = 4,["38"] = 3,["39"] = 4,["41"] = 4});
local ____exports = {}
local ____dota_ts_adapter = require("utils.dota_ts_adapter")
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
