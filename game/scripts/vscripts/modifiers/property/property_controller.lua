local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["6"] = 2,["7"] = 2,["9"] = 2,["10"] = 9,["11"] = 9,["12"] = 9,["14"] = 10,["15"] = 12,["16"] = 12,["17"] = 11,["18"] = 19,["19"] = 19});
local ____exports = {}
local Property = __TS__Class()
Property.name = "Property"
function Property.prototype.____constructor(self)
end
____exports.PropertyController = __TS__Class()
local PropertyController = ____exports.PropertyController
PropertyController.name = "PropertyController"
function PropertyController.prototype.____constructor(self)
    self.propertys = {}
    local ____self_propertys_0 = self.propertys
    ____self_propertys_0[#____self_propertys_0 + 1] = {playerSteamId = "136407523", propertyName = "move_speed", level = 1}
end
function PropertyController.prototype.InitPlayerProperty(self)
end
return ____exports
