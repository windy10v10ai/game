local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__Decorate = ____lualib.__TS__Decorate
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 1,["9"] = 1,["10"] = 2,["11"] = 2,["12"] = 4,["13"] = 5,["14"] = 4,["15"] = 5,["16"] = 6,["17"] = 7,["18"] = 6,["19"] = 9,["20"] = 10,["21"] = 9,["22"] = 5,["23"] = 4,["24"] = 5,["26"] = 5,["27"] = 14,["28"] = 15,["29"] = 14,["30"] = 15,["31"] = 16,["32"] = 17,["33"] = 16,["34"] = 19,["35"] = 20,["36"] = 19,["37"] = 15,["38"] = 14,["39"] = 15,["41"] = 15,["42"] = 24,["43"] = 25,["44"] = 24,["45"] = 25,["46"] = 26,["47"] = 27,["48"] = 26,["49"] = 29,["50"] = 30,["51"] = 29,["52"] = 25,["53"] = 24,["54"] = 25,["56"] = 25,["57"] = 34,["58"] = 35,["59"] = 34,["60"] = 35,["61"] = 36,["62"] = 37,["63"] = 36,["64"] = 39,["65"] = 40,["66"] = 39,["67"] = 35,["68"] = 34,["69"] = 35,["71"] = 35,["72"] = 44,["73"] = 45,["74"] = 44,["75"] = 45,["76"] = 46,["77"] = 47,["78"] = 46,["79"] = 49,["80"] = 50,["81"] = 49,["82"] = 45,["83"] = 44,["84"] = 45,["86"] = 45,["87"] = 54,["88"] = 55,["89"] = 54,["90"] = 55,["91"] = 56,["92"] = 57,["93"] = 56,["94"] = 59,["95"] = 60,["96"] = 59,["97"] = 55,["98"] = 54,["99"] = 55,["101"] = 55,["102"] = 64,["103"] = 65,["104"] = 64,["105"] = 65,["106"] = 66,["107"] = 67,["108"] = 66,["109"] = 69,["110"] = 70,["111"] = 71,["112"] = 72,["114"] = 74,["115"] = 69,["116"] = 65,["117"] = 64,["118"] = 65,["120"] = 65,["121"] = 78,["122"] = 79,["123"] = 78,["124"] = 79,["125"] = 80,["126"] = 81,["127"] = 80,["128"] = 83,["129"] = 84,["130"] = 83,["131"] = 79,["132"] = 78,["133"] = 79,["135"] = 79,["136"] = 88,["137"] = 89,["138"] = 88,["139"] = 89,["140"] = 90,["141"] = 91,["142"] = 90,["143"] = 93,["144"] = 94,["145"] = 93,["146"] = 89,["147"] = 88,["148"] = 89,["150"] = 89,["151"] = 98,["152"] = 99,["153"] = 98,["154"] = 99,["155"] = 100,["156"] = 101,["157"] = 100,["158"] = 103,["159"] = 104,["160"] = 103,["161"] = 99,["162"] = 98,["163"] = 99,["165"] = 99,["166"] = 108,["167"] = 109,["168"] = 108,["169"] = 109,["170"] = 110,["171"] = 111,["172"] = 110,["173"] = 113,["174"] = 114,["175"] = 113,["176"] = 109,["177"] = 108,["178"] = 109,["180"] = 109,["181"] = 118,["182"] = 119,["183"] = 118,["184"] = 119,["185"] = 120,["186"] = 121,["187"] = 120,["188"] = 123,["189"] = 124,["190"] = 123,["191"] = 119,["192"] = 118,["193"] = 119,["195"] = 119,["196"] = 128,["197"] = 129,["198"] = 128,["199"] = 129,["200"] = 130,["201"] = 131,["202"] = 130,["203"] = 133,["204"] = 134,["205"] = 133,["206"] = 129,["207"] = 128,["208"] = 129,["210"] = 129,["211"] = 138,["212"] = 139,["213"] = 138,["214"] = 139,["215"] = 140,["216"] = 141,["217"] = 140,["218"] = 143,["219"] = 144,["220"] = 143,["221"] = 139,["222"] = 138,["223"] = 139,["225"] = 139,["226"] = 148,["227"] = 149,["228"] = 148,["229"] = 149,["230"] = 150,["231"] = 151,["232"] = 150,["233"] = 153,["234"] = 154,["235"] = 153,["236"] = 149,["237"] = 148,["238"] = 149,["240"] = 149,["241"] = 159,["242"] = 160,["243"] = 159,["244"] = 160,["245"] = 161,["246"] = 162,["247"] = 161,["248"] = 164,["249"] = 166,["250"] = 166,["251"] = 166,["252"] = 166,["253"] = 166,["254"] = 166,["255"] = 166,["256"] = 164,["257"] = 160,["258"] = 159,["259"] = 160,["261"] = 160,["262"] = 171,["263"] = 172,["264"] = 171,["265"] = 172,["266"] = 173,["267"] = 174,["268"] = 173,["269"] = 176,["270"] = 178,["271"] = 176,["272"] = 172,["273"] = 171,["274"] = 172,["276"] = 172,["277"] = 182,["278"] = 183,["279"] = 182,["280"] = 183,["281"] = 184,["282"] = 185,["283"] = 184,["284"] = 187,["285"] = 188,["286"] = 187,["287"] = 183,["288"] = 182,["289"] = 183,["291"] = 183,["292"] = 192,["293"] = 193,["294"] = 192,["295"] = 193,["296"] = 194,["297"] = 195,["298"] = 194,["299"] = 200,["300"] = 201,["301"] = 200,["302"] = 203,["303"] = 204,["304"] = 203,["305"] = 193,["306"] = 192,["307"] = 193,["309"] = 193,["310"] = 208,["311"] = 209,["312"] = 208,["313"] = 209,["314"] = 210,["315"] = 211,["316"] = 210,["317"] = 209,["318"] = 208,["319"] = 209,["321"] = 209});
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
____exports.property_cast_range_bonus_stacking = __TS__Class()
local property_cast_range_bonus_stacking = ____exports.property_cast_range_bonus_stacking
property_cast_range_bonus_stacking.name = "property_cast_range_bonus_stacking"
__TS__ClassExtends(property_cast_range_bonus_stacking, PropertyBaseModifier)
function property_cast_range_bonus_stacking.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING}
end
function property_cast_range_bonus_stacking.prototype.GetModifierCastRangeBonusStacking(self, event)
    return self.value
end
property_cast_range_bonus_stacking = __TS__Decorate(
    {registerModifier(nil)},
    property_cast_range_bonus_stacking
)
____exports.property_cast_range_bonus_stacking = property_cast_range_bonus_stacking
____exports.property_spell_amplify_percentage = __TS__Class()
local property_spell_amplify_percentage = ____exports.property_spell_amplify_percentage
property_spell_amplify_percentage.name = "property_spell_amplify_percentage"
__TS__ClassExtends(property_spell_amplify_percentage, PropertyBaseModifier)
function property_spell_amplify_percentage.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE}
end
function property_spell_amplify_percentage.prototype.GetModifierSpellAmplify_Percentage(self)
    return self.value
end
property_spell_amplify_percentage = __TS__Decorate(
    {registerModifier(nil)},
    property_spell_amplify_percentage
)
____exports.property_spell_amplify_percentage = property_spell_amplify_percentage
____exports.property_status_resistance_stacking = __TS__Class()
local property_status_resistance_stacking = ____exports.property_status_resistance_stacking
property_status_resistance_stacking.name = "property_status_resistance_stacking"
__TS__ClassExtends(property_status_resistance_stacking, PropertyBaseModifier)
function property_status_resistance_stacking.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING}
end
function property_status_resistance_stacking.prototype.GetModifierStatusResistanceStacking(self)
    return self.value
end
property_status_resistance_stacking = __TS__Decorate(
    {registerModifier(nil)},
    property_status_resistance_stacking
)
____exports.property_status_resistance_stacking = property_status_resistance_stacking
____exports.property_magical_resistance_bonus = __TS__Class()
local property_magical_resistance_bonus = ____exports.property_magical_resistance_bonus
property_magical_resistance_bonus.name = "property_magical_resistance_bonus"
__TS__ClassExtends(property_magical_resistance_bonus, PropertyBaseModifier)
function property_magical_resistance_bonus.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS}
end
function property_magical_resistance_bonus.prototype.GetModifierMagicalResistanceBonus(self)
    return self.value
end
property_magical_resistance_bonus = __TS__Decorate(
    {registerModifier(nil)},
    property_magical_resistance_bonus
)
____exports.property_magical_resistance_bonus = property_magical_resistance_bonus
____exports.property_incoming_damage_percentage = __TS__Class()
local property_incoming_damage_percentage = ____exports.property_incoming_damage_percentage
property_incoming_damage_percentage.name = "property_incoming_damage_percentage"
__TS__ClassExtends(property_incoming_damage_percentage, PropertyBaseModifier)
function property_incoming_damage_percentage.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE}
end
function property_incoming_damage_percentage.prototype.GetModifierIncomingDamage_Percentage(self)
    return self.value
end
property_incoming_damage_percentage = __TS__Decorate(
    {registerModifier(nil)},
    property_incoming_damage_percentage
)
____exports.property_incoming_damage_percentage = property_incoming_damage_percentage
____exports.property_attack_range_bonus = __TS__Class()
local property_attack_range_bonus = ____exports.property_attack_range_bonus
property_attack_range_bonus.name = "property_attack_range_bonus"
__TS__ClassExtends(property_attack_range_bonus, PropertyBaseModifier)
function property_attack_range_bonus.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_ATTACK_RANGE_BONUS}
end
function property_attack_range_bonus.prototype.GetModifierAttackRangeBonus(self)
    local parent = self:GetParent()
    if parent and parent:IsRangedAttacker() then
        return self.value
    end
    return 0
end
property_attack_range_bonus = __TS__Decorate(
    {registerModifier(nil)},
    property_attack_range_bonus
)
____exports.property_attack_range_bonus = property_attack_range_bonus
____exports.property_physical_armor_bonus = __TS__Class()
local property_physical_armor_bonus = ____exports.property_physical_armor_bonus
property_physical_armor_bonus.name = "property_physical_armor_bonus"
__TS__ClassExtends(property_physical_armor_bonus, PropertyBaseModifier)
function property_physical_armor_bonus.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS}
end
function property_physical_armor_bonus.prototype.GetModifierPhysicalArmorBonus(self)
    return self.value
end
property_physical_armor_bonus = __TS__Decorate(
    {registerModifier(nil)},
    property_physical_armor_bonus
)
____exports.property_physical_armor_bonus = property_physical_armor_bonus
____exports.property_preattack_bonus_damage = __TS__Class()
local property_preattack_bonus_damage = ____exports.property_preattack_bonus_damage
property_preattack_bonus_damage.name = "property_preattack_bonus_damage"
__TS__ClassExtends(property_preattack_bonus_damage, PropertyBaseModifier)
function property_preattack_bonus_damage.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE}
end
function property_preattack_bonus_damage.prototype.GetModifierPreAttack_BonusDamage(self)
    return self.value
end
property_preattack_bonus_damage = __TS__Decorate(
    {registerModifier(nil)},
    property_preattack_bonus_damage
)
____exports.property_preattack_bonus_damage = property_preattack_bonus_damage
____exports.property_attackspeed_bonus_constant = __TS__Class()
local property_attackspeed_bonus_constant = ____exports.property_attackspeed_bonus_constant
property_attackspeed_bonus_constant.name = "property_attackspeed_bonus_constant"
__TS__ClassExtends(property_attackspeed_bonus_constant, PropertyBaseModifier)
function property_attackspeed_bonus_constant.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT}
end
function property_attackspeed_bonus_constant.prototype.GetModifierAttackSpeedBonus_Constant(self)
    return self.value
end
property_attackspeed_bonus_constant = __TS__Decorate(
    {registerModifier(nil)},
    property_attackspeed_bonus_constant
)
____exports.property_attackspeed_bonus_constant = property_attackspeed_bonus_constant
____exports.property_stats_strength_bonus = __TS__Class()
local property_stats_strength_bonus = ____exports.property_stats_strength_bonus
property_stats_strength_bonus.name = "property_stats_strength_bonus"
__TS__ClassExtends(property_stats_strength_bonus, PropertyBaseModifier)
function property_stats_strength_bonus.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_STATS_STRENGTH_BONUS}
end
function property_stats_strength_bonus.prototype.GetModifierBonusStats_Strength(self)
    return self.value
end
property_stats_strength_bonus = __TS__Decorate(
    {registerModifier(nil)},
    property_stats_strength_bonus
)
____exports.property_stats_strength_bonus = property_stats_strength_bonus
____exports.property_stats_agility_bonus = __TS__Class()
local property_stats_agility_bonus = ____exports.property_stats_agility_bonus
property_stats_agility_bonus.name = "property_stats_agility_bonus"
__TS__ClassExtends(property_stats_agility_bonus, PropertyBaseModifier)
function property_stats_agility_bonus.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_STATS_AGILITY_BONUS}
end
function property_stats_agility_bonus.prototype.GetModifierBonusStats_Agility(self)
    return self.value
end
property_stats_agility_bonus = __TS__Decorate(
    {registerModifier(nil)},
    property_stats_agility_bonus
)
____exports.property_stats_agility_bonus = property_stats_agility_bonus
____exports.property_stats_intellect_bonus = __TS__Class()
local property_stats_intellect_bonus = ____exports.property_stats_intellect_bonus
property_stats_intellect_bonus.name = "property_stats_intellect_bonus"
__TS__ClassExtends(property_stats_intellect_bonus, PropertyBaseModifier)
function property_stats_intellect_bonus.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_STATS_INTELLECT_BONUS}
end
function property_stats_intellect_bonus.prototype.GetModifierBonusStats_Intellect(self)
    return self.value
end
property_stats_intellect_bonus = __TS__Decorate(
    {registerModifier(nil)},
    property_stats_intellect_bonus
)
____exports.property_stats_intellect_bonus = property_stats_intellect_bonus
____exports.property_health_regen_percentage = __TS__Class()
local property_health_regen_percentage = ____exports.property_health_regen_percentage
property_health_regen_percentage.name = "property_health_regen_percentage"
__TS__ClassExtends(property_health_regen_percentage, PropertyBaseModifier)
function property_health_regen_percentage.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE}
end
function property_health_regen_percentage.prototype.GetModifierHealthRegenPercentage(self)
    return self.value
end
property_health_regen_percentage = __TS__Decorate(
    {registerModifier(nil)},
    property_health_regen_percentage
)
____exports.property_health_regen_percentage = property_health_regen_percentage
____exports.property_mana_regen_total_percentage = __TS__Class()
local property_mana_regen_total_percentage = ____exports.property_mana_regen_total_percentage
property_mana_regen_total_percentage.name = "property_mana_regen_total_percentage"
__TS__ClassExtends(property_mana_regen_total_percentage, PropertyBaseModifier)
function property_mana_regen_total_percentage.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_MANA_REGEN_TOTAL_PERCENTAGE}
end
function property_mana_regen_total_percentage.prototype.GetModifierTotalPercentageManaRegen(self)
    return self.value
end
property_mana_regen_total_percentage = __TS__Decorate(
    {registerModifier(nil)},
    property_mana_regen_total_percentage
)
____exports.property_mana_regen_total_percentage = property_mana_regen_total_percentage
____exports.property_lifesteal = __TS__Class()
local property_lifesteal = ____exports.property_lifesteal
property_lifesteal.name = "property_lifesteal"
__TS__ClassExtends(property_lifesteal, PropertyBaseModifier)
function property_lifesteal.prototype.DeclareFunctions(self)
    return {MODIFIER_EVENT_ON_ATTACK_LANDED}
end
function property_lifesteal.prototype.OnAttackLanded(self, event)
    TsLifeStealOnAttackLanded(
        nil,
        event,
        self.value,
        self:GetParent(),
        self
    )
end
property_lifesteal = __TS__Decorate(
    {registerModifier(nil)},
    property_lifesteal
)
____exports.property_lifesteal = property_lifesteal
____exports.property_spell_lifesteal = __TS__Class()
local property_spell_lifesteal = ____exports.property_spell_lifesteal
property_spell_lifesteal.name = "property_spell_lifesteal"
__TS__ClassExtends(property_spell_lifesteal, PropertyBaseModifier)
function property_spell_lifesteal.prototype.DeclareFunctions(self)
    return {MODIFIER_EVENT_ON_TAKEDAMAGE}
end
function property_spell_lifesteal.prototype.OnTakeDamage(self, event)
    TsSpellLifeSteal(nil, event, self, self.value)
end
property_spell_lifesteal = __TS__Decorate(
    {registerModifier(nil)},
    property_spell_lifesteal
)
____exports.property_spell_lifesteal = property_spell_lifesteal
____exports.property_movespeed_bonus_constant = __TS__Class()
local property_movespeed_bonus_constant = ____exports.property_movespeed_bonus_constant
property_movespeed_bonus_constant.name = "property_movespeed_bonus_constant"
__TS__ClassExtends(property_movespeed_bonus_constant, PropertyBaseModifier)
function property_movespeed_bonus_constant.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT}
end
function property_movespeed_bonus_constant.prototype.GetModifierMoveSpeedBonus_Constant(self)
    return self.value
end
property_movespeed_bonus_constant = __TS__Decorate(
    {registerModifier(nil)},
    property_movespeed_bonus_constant
)
____exports.property_movespeed_bonus_constant = property_movespeed_bonus_constant
____exports.property_ignore_movespeed_limit = __TS__Class()
local property_ignore_movespeed_limit = ____exports.property_ignore_movespeed_limit
property_ignore_movespeed_limit.name = "property_ignore_movespeed_limit"
__TS__ClassExtends(property_ignore_movespeed_limit, PropertyBaseModifier)
function property_ignore_movespeed_limit.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT, MODIFIER_PROPERTY_MOVESPEED_LIMIT}
end
function property_ignore_movespeed_limit.prototype.GetModifierIgnoreMovespeedLimit(self)
    return 1
end
function property_ignore_movespeed_limit.prototype.GetModifierMoveSpeed_Limit(self)
    return 5000
end
property_ignore_movespeed_limit = __TS__Decorate(
    {registerModifier(nil)},
    property_ignore_movespeed_limit
)
____exports.property_ignore_movespeed_limit = property_ignore_movespeed_limit
____exports.property_cannot_miss = __TS__Class()
local property_cannot_miss = ____exports.property_cannot_miss
property_cannot_miss.name = "property_cannot_miss"
__TS__ClassExtends(property_cannot_miss, PropertyBaseModifier)
function property_cannot_miss.prototype.CheckState(self)
    return {[MODIFIER_STATE_CANNOT_MISS] = true}
end
property_cannot_miss = __TS__Decorate(
    {registerModifier(nil)},
    property_cannot_miss
)
____exports.property_cannot_miss = property_cannot_miss
return ____exports
