local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local Map = ____lualib.Map
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFilter = ____lualib.__TS__ArrayFilter
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["9"] = 3,["10"] = 3,["11"] = 5,["12"] = 5,["14"] = 5,["15"] = 11,["16"] = 11,["17"] = 11,["19"] = 12,["20"] = 13,["21"] = 16,["22"] = 19,["23"] = 19,["24"] = 14,["25"] = 26,["26"] = 27,["29"] = 31,["30"] = 32,["31"] = 32,["32"] = 32,["33"] = 32,["34"] = 34,["35"] = 36,["36"] = 37,["37"] = 39,["38"] = 41,["41"] = 26});
local ____exports = {}
local ____property_cooldown = require("modifiers.property.property_cooldown")
local ModifierPropertyCooldown = ____property_cooldown.ModifierPropertyCooldown
local Property = __TS__Class()
Property.name = "Property"
function Property.prototype.____constructor(self)
end
____exports.PropertyController = __TS__Class()
local PropertyController = ____exports.PropertyController
PropertyController.name = "PropertyController"
function PropertyController.prototype.____constructor(self)
    self.propertyValuePerLevel = __TS__New(Map)
    self.propertys = {}
    self.propertyValuePerLevel:set(ModifierPropertyCooldown.name, 4)
    local ____self_propertys_0 = self.propertys
    ____self_propertys_0[#____self_propertys_0 + 1] = {playerSteamId = "136407523", propertyName = "ModifierPropertyCooldown", level = 10}
end
function PropertyController.prototype.InitPlayerProperty(self, hero)
    if not hero then
        return
    end
    local steamId = PlayerResource:GetSteamAccountID(hero:GetPlayerOwnerID())
    local currentPlayerPropertys = __TS__ArrayFilter(
        self.propertys,
        function(____, m) return m.playerSteamId == tostring(steamId) end
    )
    for ____, property in ipairs(currentPlayerPropertys) do
        local propertyValuePerLevel = self.propertyValuePerLevel:get(property.propertyName)
        if propertyValuePerLevel then
            TsPrint(nil, "InitPlayerProperty " .. property.propertyName)
            hero:AddNewModifier(hero, nil, property.propertyName, {value = propertyValuePerLevel * property.level})
        end
    end
end
return ____exports
