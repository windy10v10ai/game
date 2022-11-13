local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local Map = ____lualib.Map
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["9"] = 1,["10"] = 1,["11"] = 2,["12"] = 2,["13"] = 2,["14"] = 2,["15"] = 4,["16"] = 4,["17"] = 4,["19"] = 5,["20"] = 8,["21"] = 9,["22"] = 10,["23"] = 6,["24"] = 13,["25"] = 14,["28"] = 18,["29"] = 19,["30"] = 19,["31"] = 19,["32"] = 19,["33"] = 21,["34"] = 21,["35"] = 21,["37"] = 21,["40"] = 25,["41"] = 26,["42"] = 27,["43"] = 29,["46"] = 13});
local ____exports = {}
local ____player = require("api.player")
local Player = ____player.Player
local ____property_declare = require("modifiers.property.property_declare")
local property_cast_range_bonus_stacking = ____property_declare.property_cast_range_bonus_stacking
local property_cooldown_percentage = ____property_declare.property_cooldown_percentage
local property_status_resistance_stacking = ____property_declare.property_status_resistance_stacking
____exports.PropertyController = __TS__Class()
local PropertyController = ____exports.PropertyController
PropertyController.name = "PropertyController"
function PropertyController.prototype.____constructor(self)
    self.propertyValuePerLevel = __TS__New(Map)
    self.propertyValuePerLevel:set(property_cooldown_percentage.name, 4)
    self.propertyValuePerLevel:set(property_status_resistance_stacking.name, 4)
    self.propertyValuePerLevel:set(property_cast_range_bonus_stacking.name, 25)
end
function PropertyController.prototype.InitPlayerProperty(self, hero)
    if not hero then
        return
    end
    local steamId = PlayerResource:GetSteamAccountID(hero:GetPlayerOwnerID())
    local playerInfo = __TS__ArrayFind(
        Player.playerList,
        function(____, player) return player.id == tostring(steamId) end
    )
    local ____playerInfo_properties_0 = playerInfo
    if ____playerInfo_properties_0 ~= nil then
        ____playerInfo_properties_0 = ____playerInfo_properties_0.properties
    end
    if not ____playerInfo_properties_0 then
        return
    end
    for ____, property in ipairs(playerInfo.properties) do
        local propertyValuePerLevel = self.propertyValuePerLevel:get(property.name)
        if propertyValuePerLevel then
            hero:AddNewModifier(hero, nil, property.name, {value = propertyValuePerLevel * property.level})
        end
    end
end
return ____exports
