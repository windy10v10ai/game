local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local Map = ____lualib.Map
local __TS__New = ____lualib.__TS__New
local __TS__ArrayFind = ____lualib.__TS__ArrayFind
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["9"] = 1,["10"] = 1,["11"] = 2,["12"] = 2,["13"] = 2,["14"] = 2,["15"] = 2,["16"] = 2,["17"] = 2,["18"] = 2,["19"] = 2,["20"] = 2,["21"] = 2,["22"] = 2,["23"] = 2,["24"] = 2,["25"] = 2,["26"] = 2,["27"] = 2,["28"] = 2,["29"] = 2,["30"] = 2,["31"] = 4,["32"] = 4,["33"] = 4,["35"] = 5,["36"] = 8,["37"] = 9,["38"] = 10,["39"] = 11,["40"] = 12,["41"] = 13,["42"] = 14,["43"] = 15,["44"] = 16,["45"] = 17,["46"] = 18,["47"] = 19,["48"] = 20,["49"] = 21,["50"] = 22,["51"] = 23,["52"] = 24,["53"] = 25,["54"] = 26,["55"] = 6,["56"] = 29,["57"] = 30,["60"] = 34,["61"] = 35,["62"] = 35,["63"] = 35,["64"] = 35,["65"] = 37,["66"] = 37,["67"] = 37,["69"] = 37,["72"] = 41,["73"] = 42,["74"] = 43,["75"] = 44,["76"] = 45,["77"] = 46,["81"] = 29});
local ____exports = {}
local ____player = require("api.player")
local Player = ____player.Player
local ____property_declare = require("modifiers.property.property_declare")
local property_attackspeed_bonus_constant = ____property_declare.property_attackspeed_bonus_constant
local property_attack_range_bonus = ____property_declare.property_attack_range_bonus
local property_cannot_miss = ____property_declare.property_cannot_miss
local property_cast_range_bonus_stacking = ____property_declare.property_cast_range_bonus_stacking
local property_cooldown_percentage = ____property_declare.property_cooldown_percentage
local property_health_regen_percentage = ____property_declare.property_health_regen_percentage
local property_ignore_movespeed_limit = ____property_declare.property_ignore_movespeed_limit
local property_lifesteal = ____property_declare.property_lifesteal
local property_magical_resistance_bonus = ____property_declare.property_magical_resistance_bonus
local property_mana_regen_total_percentage = ____property_declare.property_mana_regen_total_percentage
local property_movespeed_bonus_constant = ____property_declare.property_movespeed_bonus_constant
local property_physical_armor_bonus = ____property_declare.property_physical_armor_bonus
local property_preattack_bonus_damage = ____property_declare.property_preattack_bonus_damage
local property_spell_amplify_percentage = ____property_declare.property_spell_amplify_percentage
local property_spell_lifesteal = ____property_declare.property_spell_lifesteal
local property_stats_agility_bonus = ____property_declare.property_stats_agility_bonus
local property_stats_intellect_bonus = ____property_declare.property_stats_intellect_bonus
local property_stats_strength_bonus = ____property_declare.property_stats_strength_bonus
local property_status_resistance_stacking = ____property_declare.property_status_resistance_stacking
____exports.PropertyController = __TS__Class()
local PropertyController = ____exports.PropertyController
PropertyController.name = "PropertyController"
function PropertyController.prototype.____constructor(self)
    self.propertyValuePerLevel = __TS__New(Map)
    self.propertyValuePerLevel:set(property_cooldown_percentage.name, 4)
    self.propertyValuePerLevel:set(property_cast_range_bonus_stacking.name, 25)
    self.propertyValuePerLevel:set(property_spell_amplify_percentage.name, 5)
    self.propertyValuePerLevel:set(property_status_resistance_stacking.name, 4)
    self.propertyValuePerLevel:set(property_magical_resistance_bonus.name, 4)
    self.propertyValuePerLevel:set(property_attack_range_bonus.name, 25)
    self.propertyValuePerLevel:set(property_physical_armor_bonus.name, 5)
    self.propertyValuePerLevel:set(property_preattack_bonus_damage.name, 15)
    self.propertyValuePerLevel:set(property_attackspeed_bonus_constant.name, 15)
    self.propertyValuePerLevel:set(property_stats_strength_bonus.name, 10)
    self.propertyValuePerLevel:set(property_stats_agility_bonus.name, 10)
    self.propertyValuePerLevel:set(property_stats_intellect_bonus.name, 10)
    self.propertyValuePerLevel:set(property_health_regen_percentage.name, 0.25)
    self.propertyValuePerLevel:set(property_mana_regen_total_percentage.name, 0.25)
    self.propertyValuePerLevel:set(property_lifesteal.name, 7.5)
    self.propertyValuePerLevel:set(property_spell_lifesteal.name, 7.5)
    self.propertyValuePerLevel:set(property_movespeed_bonus_constant.name, 25)
    self.propertyValuePerLevel:set(property_ignore_movespeed_limit.name, 0.125)
    self.propertyValuePerLevel:set(property_cannot_miss.name, 0.125)
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
            local value = propertyValuePerLevel * property.level
            if value > 0 then
                hero:AddNewModifier(hero, nil, property.name, {value = value})
            end
        end
    end
end
return ____exports
