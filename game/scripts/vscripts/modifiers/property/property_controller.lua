local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local Map = ____lualib.Map
local __TS__New = ____lualib.__TS__New
local __TS__StringEndsWith = ____lualib.__TS__StringEndsWith
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["9"] = 2,["10"] = 3,["11"] = 4,["12"] = 5,["13"] = 6,["14"] = 7,["15"] = 8,["16"] = 9,["17"] = 10,["18"] = 11,["19"] = 12,["20"] = 13,["21"] = 14,["22"] = 15,["23"] = 16,["24"] = 17,["25"] = 18,["26"] = 19,["27"] = 20,["28"] = 21,["29"] = 22,["30"] = 23,["31"] = 26,["32"] = 26,["33"] = 26,["35"] = 30,["36"] = 31,["37"] = 35,["38"] = 39,["39"] = 43,["40"] = 47,["41"] = 51,["42"] = 55,["43"] = 59,["44"] = 63,["45"] = 67,["46"] = 71,["47"] = 72,["48"] = 76,["49"] = 80,["50"] = 86,["51"] = 91,["52"] = 95,["53"] = 99,["54"] = 103,["55"] = 107,["56"] = 111,["57"] = 29,["58"] = 117,["59"] = 121,["60"] = 124,["61"] = 125,["62"] = 126,["63"] = 127,["64"] = 128,["67"] = 133,["68"] = 136,["69"] = 137,["72"] = 117,["73"] = 146,["75"] = 147,["76"] = 147,["77"] = 148,["78"] = 149,["79"] = 150,["80"] = 151,["81"] = 152,["82"] = 153,["86"] = 147,["89"] = 146,["90"] = 160,["91"] = 165,["94"] = 169,["96"] = 171,["97"] = 171,["98"] = 172,["99"] = 171,["102"] = 174,["104"] = 176,["106"] = 179,["107"] = 184,["108"] = 187,["109"] = 160,["110"] = 27,["111"] = 28});
local ____exports = {}
local ____property_declare = require("modifiers.property.property_declare")
local property_attackspeed_bonus_constant = ____property_declare.property_attackspeed_bonus_constant
local property_attack_range_bonus = ____property_declare.property_attack_range_bonus
local property_cannot_miss = ____property_declare.property_cannot_miss
local property_cast_range_bonus_stacking = ____property_declare.property_cast_range_bonus_stacking
local property_cooldown_percentage = ____property_declare.property_cooldown_percentage
local property_health_regen_percentage = ____property_declare.property_health_regen_percentage
local property_ignore_movespeed_limit = ____property_declare.property_ignore_movespeed_limit
local property_incoming_damage_percentage = ____property_declare.property_incoming_damage_percentage
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
local property_evasion_constant = ____property_declare.property_evasion_constant
____exports.PropertyController = __TS__Class()
local PropertyController = ____exports.PropertyController
PropertyController.name = "PropertyController"
function PropertyController.prototype.____constructor(self)
    print("PropertyController init")
    ____exports.PropertyController.propertyValuePerLevel:set(property_cooldown_percentage.name, 4)
    ____exports.PropertyController.propertyValuePerLevel:set(property_cast_range_bonus_stacking.name, 25)
    ____exports.PropertyController.propertyValuePerLevel:set(property_spell_amplify_percentage.name, 5)
    ____exports.PropertyController.propertyValuePerLevel:set(property_status_resistance_stacking.name, 4)
    ____exports.PropertyController.propertyValuePerLevel:set(property_evasion_constant.name, 4)
    ____exports.PropertyController.propertyValuePerLevel:set(property_magical_resistance_bonus.name, 4)
    ____exports.PropertyController.propertyValuePerLevel:set(property_incoming_damage_percentage.name, -4)
    ____exports.PropertyController.propertyValuePerLevel:set(property_attack_range_bonus.name, 25)
    ____exports.PropertyController.propertyValuePerLevel:set(property_health_regen_percentage.name, 0.3)
    ____exports.PropertyController.propertyValuePerLevel:set(property_mana_regen_total_percentage.name, 0.3)
    ____exports.PropertyController.propertyValuePerLevel:set(property_lifesteal.name, 10)
    ____exports.PropertyController.propertyValuePerLevel:set(property_spell_lifesteal.name, 8)
    ____exports.PropertyController.propertyValuePerLevel:set(property_ignore_movespeed_limit.name, 0.125)
    ____exports.PropertyController.propertyValuePerLevel:set(property_cannot_miss.name, 0.125)
    ____exports.PropertyController.propertyDataDrivenName:set(property_movespeed_bonus_constant.name, "modifier_player_property_movespeed_bonus_constant_level_")
    ____exports.PropertyController.propertyDataDrivenName:set(property_physical_armor_bonus.name, "modifier_player_property_physical_armor_bonus_level_")
    ____exports.PropertyController.propertyDataDrivenName:set(property_preattack_bonus_damage.name, "modifier_player_property_preattack_bonus_damage_level_")
    ____exports.PropertyController.propertyDataDrivenName:set(property_attackspeed_bonus_constant.name, "modifier_player_property_attackspeed_bonus_constant_level_")
    ____exports.PropertyController.propertyDataDrivenName:set(property_stats_strength_bonus.name, "modifier_player_property_stats_strength_bonus_level_")
    ____exports.PropertyController.propertyDataDrivenName:set(property_stats_agility_bonus.name, "modifier_player_property_stats_agility_bonus_level_")
    ____exports.PropertyController.propertyDataDrivenName:set(property_stats_intellect_bonus.name, "modifier_player_property_stats_intellect_bonus_level_")
end
function PropertyController.addModifier(self, hero, property)
    local propertyValuePerLevel = ____exports.PropertyController.propertyValuePerLevel:get(property.name)
    if propertyValuePerLevel then
        local value = propertyValuePerLevel * property.level
        if value ~= 0 then
            hero:RemoveModifierByName(property.name)
            hero:AddNewModifier(hero, nil, property.name, {value = value})
        end
    else
        local dataDrivenName = ____exports.PropertyController.propertyDataDrivenName:get(property.name)
        if dataDrivenName then
            self:refreshDataDrivenPlayerProperty(hero, dataDrivenName, property.level)
        end
    end
end
function PropertyController.RefreshPlayerProperty(self, property)
    do
        local i = 0
        while i < PlayerResource:GetPlayerCount() do
            if PlayerResource:IsValidPlayer(i) then
                local steamId = PlayerResource:GetSteamAccountID(i)
                if steamId == property.steamId then
                    local hero = PlayerResource:GetSelectedHeroEntity(i)
                    if hero then
                        ____exports.PropertyController:addModifier(hero, property)
                    end
                end
            end
            i = i + 1
        end
    end
end
function PropertyController.refreshDataDrivenPlayerProperty(self, hero, dataDrivenName, level)
    if level == 0 then
        return
    end
    if __TS__StringEndsWith(dataDrivenName, "_level_") then
        do
            local i = 1
            while i <= 8 do
                hero:RemoveModifierByName(dataDrivenName .. tostring(i))
                i = i + 1
            end
        end
        dataDrivenName = dataDrivenName .. tostring(level)
    else
        hero:RemoveModifierByName(dataDrivenName)
    end
    local modifierItem = CreateItem("item_player_modifiers", nil, nil)
    modifierItem:ApplyDataDrivenModifier(hero, hero, dataDrivenName, {duration = -1})
    UTIL_RemoveImmediate(modifierItem)
end
PropertyController.propertyValuePerLevel = __TS__New(Map)
PropertyController.propertyDataDrivenName = __TS__New(Map)
return ____exports
