local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__Decorate = ____lualib.__TS__Decorate
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 1,["9"] = 1,["10"] = 2,["11"] = 2,["12"] = 4,["13"] = 5,["14"] = 4,["15"] = 5,["16"] = 7,["17"] = 8,["18"] = 7,["19"] = 10,["20"] = 11,["21"] = 10,["22"] = 5,["23"] = 4,["24"] = 5,["26"] = 5});
local ____exports = {}
local ____dota_ts_adapter = require("lib.dota_ts_adapter")
local registerModifier = ____dota_ts_adapter.registerModifier
local ____property_base = require("modifiers.property.property_base")
local PropertyBaseModifier = ____property_base.PropertyBaseModifier
____exports.property_cooldown_percentage = __TS__Class()
local property_cooldown_percentage = ____exports.property_cooldown_percentage
property_cooldown_percentage.name = "property_cooldown_percentage"
__TS__ClassExtends(property_cooldown_percentage, PropertyBaseModifier)
function property_cooldown_percentage.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE}
end
function property_cooldown_percentage.prototype.GetModifierPercentageCooldown(self)
    return self.value
end
property_cooldown_percentage = __TS__Decorate(
    {registerModifier(nil)},
    property_cooldown_percentage
)
____exports.property_cooldown_percentage = property_cooldown_percentage
return ____exports
