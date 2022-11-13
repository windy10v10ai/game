local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local Map = ____lualib.Map
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["9"] = 1,["10"] = 1,["11"] = 2,["12"] = 2,["13"] = 4,["14"] = 4,["15"] = 4,["17"] = 5,["18"] = 8,["19"] = 6,["20"] = 11,["21"] = 12,["24"] = 16,["25"] = 17,["26"] = 17,["27"] = 17,["28"] = 17,["29"] = 19,["30"] = 19,["31"] = 19,["33"] = 19,["36"] = 23,["37"] = 24,["38"] = 25,["39"] = 26,["40"] = 28,["41"] = 28,["42"] = 28,["43"] = 28,["44"] = 30,["47"] = 11});
local ____exports = {}
local ____player = require("api.player")
local Player = ____player.Player
local ____property_cooldown_percentage = require("modifiers.property.property_cooldown_percentage")
local property_cooldown_percentage = ____property_cooldown_percentage.property_cooldown_percentage
____exports.PropertyController = __TS__Class()
local PropertyController = ____exports.PropertyController
PropertyController.name = "PropertyController"
function PropertyController.prototype.____constructor(self)
    self.propertyValuePerLevel = __TS__New(Map)
    self.propertyValuePerLevel:set(property_cooldown_percentage.name, 4)
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
        print(((("currentPlayerPropertys " .. property.name) .. " level ") .. tostring(property.level)) .. " ")
        local propertyValuePerLevel = self.propertyValuePerLevel:get(property.name)
        if propertyValuePerLevel then
            TsPrint(
                nil,
                ("InitPlayerProperty " .. tostring(property.propertyName)) .. " "
            )
            hero:AddNewModifier(hero, nil, property.name, {value = propertyValuePerLevel * property.level})
        end
    end
end
return ____exports
