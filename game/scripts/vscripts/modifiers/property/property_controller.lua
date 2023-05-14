local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local Map = ____lualib.Map
local __TS__New = ____lualib.__TS__New
local __TS__StringEndsWith = ____lualib.__TS__StringEndsWith
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["9"] = 2,["10"] = 2,["11"] = 2,["12"] = 2,["13"] = 2,["14"] = 2,["15"] = 2,["16"] = 2,["17"] = 2,["18"] = 2,["19"] = 2,["20"] = 2,["21"] = 2,["22"] = 2,["23"] = 2,["24"] = 2,["25"] = 2,["26"] = 2,["27"] = 2,["28"] = 2,["29"] = 2,["30"] = 4,["31"] = 4,["32"] = 4,["34"] = 8,["35"] = 9,["36"] = 10,["37"] = 11,["38"] = 12,["39"] = 13,["40"] = 14,["41"] = 15,["42"] = 16,["43"] = 17,["44"] = 18,["45"] = 19,["46"] = 20,["47"] = 21,["48"] = 24,["49"] = 28,["50"] = 31,["51"] = 34,["52"] = 37,["53"] = 40,["54"] = 43,["55"] = 7,["56"] = 48,["57"] = 49,["58"] = 50,["59"] = 51,["60"] = 52,["61"] = 53,["62"] = 54,["65"] = 59,["66"] = 60,["67"] = 61,["70"] = 48,["71"] = 66,["72"] = 67,["74"] = 69,["75"] = 69,["76"] = 70,["77"] = 71,["78"] = 72,["79"] = 73,["80"] = 74,["81"] = 75,["85"] = 69,["88"] = 66,["89"] = 82,["90"] = 83,["93"] = 87,["95"] = 89,["96"] = 89,["97"] = 90,["98"] = 89,["101"] = 92,["103"] = 94,["105"] = 97,["106"] = 98,["107"] = 99,["108"] = 82,["109"] = 5,["110"] = 6});
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
____exports.PropertyController = __TS__Class()
local PropertyController = ____exports.PropertyController
PropertyController.name = "PropertyController"
function PropertyController.prototype.____constructor(self)
    print("PropertyController init")
    ____exports.PropertyController.propertyValuePerLevel:set(property_cooldown_percentage.name, 4)
    ____exports.PropertyController.propertyValuePerLevel:set(property_cast_range_bonus_stacking.name, 25)
    ____exports.PropertyController.propertyValuePerLevel:set(property_spell_amplify_percentage.name, 5)
    ____exports.PropertyController.propertyValuePerLevel:set(property_status_resistance_stacking.name, 4)
    ____exports.PropertyController.propertyValuePerLevel:set(property_magical_resistance_bonus.name, 4)
    ____exports.PropertyController.propertyValuePerLevel:set(property_incoming_damage_percentage.name, -4)
    ____exports.PropertyController.propertyValuePerLevel:set(property_attack_range_bonus.name, 25)
    ____exports.PropertyController.propertyValuePerLevel:set(property_health_regen_percentage.name, 0.3)
    ____exports.PropertyController.propertyValuePerLevel:set(property_mana_regen_total_percentage.name, 0.3)
    ____exports.PropertyController.propertyValuePerLevel:set(property_lifesteal.name, 7.5)
    ____exports.PropertyController.propertyValuePerLevel:set(property_spell_lifesteal.name, 7.5)
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
    local steamId = property.steamId
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
