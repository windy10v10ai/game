local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__Decorate = ____lualib.__TS__Decorate
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 1,["9"] = 1,["10"] = 2,["11"] = 2,["12"] = 4,["13"] = 5,["14"] = 4,["15"] = 5,["16"] = 6,["17"] = 7,["18"] = 6,["19"] = 10,["20"] = 11,["21"] = 10,["22"] = 5,["23"] = 4,["24"] = 5,["26"] = 5,["27"] = 15,["28"] = 16,["29"] = 15,["30"] = 16,["31"] = 17,["32"] = 18,["33"] = 17,["34"] = 21,["35"] = 22,["36"] = 21,["37"] = 16,["38"] = 15,["39"] = 16,["41"] = 16,["42"] = 26,["43"] = 27,["44"] = 26,["45"] = 27,["46"] = 28,["47"] = 29,["48"] = 28,["49"] = 32,["50"] = 33,["51"] = 32,["52"] = 27,["53"] = 26,["54"] = 27,["56"] = 27,["57"] = 37,["58"] = 38,["59"] = 37,["60"] = 38,["61"] = 39,["62"] = 40,["63"] = 39,["64"] = 43,["65"] = 44,["66"] = 43,["67"] = 38,["68"] = 37,["69"] = 38,["71"] = 38,["72"] = 49,["73"] = 50,["74"] = 49,["75"] = 50,["76"] = 51,["77"] = 52,["78"] = 51,["79"] = 55,["80"] = 56,["81"] = 55,["82"] = 50,["83"] = 49,["84"] = 50,["86"] = 50,["87"] = 60,["88"] = 61,["89"] = 60,["90"] = 61,["91"] = 62,["92"] = 63,["93"] = 62,["94"] = 66,["95"] = 67,["96"] = 66,["97"] = 61,["98"] = 60,["99"] = 61,["101"] = 61,["102"] = 71,["103"] = 72,["104"] = 71,["105"] = 72,["106"] = 73,["107"] = 74,["108"] = 73,["109"] = 77,["110"] = 78,["111"] = 77,["112"] = 72,["113"] = 71,["114"] = 72,["116"] = 72,["117"] = 82,["118"] = 83,["119"] = 82,["120"] = 83,["121"] = 84,["122"] = 85,["123"] = 84,["124"] = 88,["125"] = 89,["126"] = 90,["127"] = 91,["129"] = 93,["130"] = 88,["131"] = 83,["132"] = 82,["133"] = 83,["135"] = 83,["136"] = 97,["137"] = 98,["138"] = 97,["139"] = 98,["140"] = 99,["141"] = 100,["142"] = 99,["143"] = 103,["144"] = 104,["145"] = 103,["146"] = 98,["147"] = 97,["148"] = 98,["150"] = 98,["151"] = 108,["152"] = 109,["153"] = 108,["154"] = 109,["155"] = 110,["156"] = 111,["157"] = 110,["158"] = 114,["159"] = 115,["160"] = 114,["161"] = 109,["162"] = 108,["163"] = 109,["165"] = 109,["166"] = 119,["167"] = 120,["168"] = 119,["169"] = 120,["170"] = 121,["171"] = 122,["172"] = 121,["173"] = 125,["174"] = 126,["175"] = 125,["176"] = 120,["177"] = 119,["178"] = 120,["180"] = 120,["181"] = 130,["182"] = 131,["183"] = 130,["184"] = 131,["185"] = 132,["186"] = 133,["187"] = 132,["188"] = 136,["189"] = 137,["190"] = 136,["191"] = 131,["192"] = 130,["193"] = 131,["195"] = 131,["196"] = 141,["197"] = 142,["198"] = 141,["199"] = 142,["200"] = 143,["201"] = 144,["202"] = 143,["203"] = 147,["204"] = 148,["205"] = 147,["206"] = 142,["207"] = 141,["208"] = 142,["210"] = 142,["211"] = 152,["212"] = 153,["213"] = 152,["214"] = 153,["215"] = 154,["216"] = 155,["217"] = 154,["218"] = 158,["219"] = 159,["220"] = 158,["221"] = 153,["222"] = 152,["223"] = 153,["225"] = 153,["226"] = 163,["227"] = 164,["228"] = 163,["229"] = 164,["230"] = 165,["231"] = 166,["232"] = 165,["233"] = 169,["234"] = 170,["235"] = 169,["236"] = 164,["237"] = 163,["238"] = 164,["240"] = 164,["241"] = 174,["242"] = 175,["243"] = 174,["244"] = 175,["245"] = 176,["246"] = 177,["247"] = 176,["248"] = 180,["249"] = 181,["250"] = 180,["251"] = 175,["252"] = 174,["253"] = 175,["255"] = 175,["256"] = 185,["257"] = 186,["258"] = 185,["259"] = 186,["260"] = 187,["261"] = 188,["262"] = 187,["263"] = 191,["264"] = 193,["265"] = 193,["266"] = 193,["267"] = 193,["268"] = 193,["269"] = 193,["270"] = 193,["271"] = 191,["272"] = 186,["273"] = 185,["274"] = 186,["276"] = 186,["277"] = 197,["278"] = 198,["279"] = 197,["280"] = 198,["281"] = 199,["282"] = 200,["283"] = 199,["284"] = 203,["285"] = 205,["286"] = 203,["287"] = 198,["288"] = 197,["289"] = 198,["291"] = 198,["292"] = 209,["293"] = 210,["294"] = 209,["295"] = 210,["296"] = 211,["297"] = 212,["298"] = 211,["299"] = 215,["300"] = 216,["301"] = 215,["302"] = 210,["303"] = 209,["304"] = 210,["306"] = 210,["307"] = 220,["308"] = 221,["309"] = 220,["310"] = 221,["311"] = 222,["312"] = 223,["313"] = 222,["314"] = 226,["315"] = 227,["316"] = 226,["317"] = 230,["318"] = 231,["319"] = 230,["320"] = 221,["321"] = 220,["322"] = 221,["324"] = 221,["325"] = 235,["326"] = 236,["327"] = 235,["328"] = 236,["329"] = 237,["330"] = 238,["331"] = 237,["332"] = 236,["333"] = 235,["334"] = 236,["336"] = 236});
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
function property_cast_range_bonus_stacking.prototype.GetModifierCastRangeBonusStacking(self)
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
____exports.property_evasion_constant = __TS__Class()
local property_evasion_constant = ____exports.property_evasion_constant
property_evasion_constant.name = "property_evasion_constant"
__TS__ClassExtends(property_evasion_constant, PropertyBaseModifier)
function property_evasion_constant.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_EVASION_CONSTANT}
end
function property_evasion_constant.prototype.GetModifierEvasion_Constant(self)
    return self.value
end
property_evasion_constant = __TS__Decorate(
    {registerModifier(nil)},
    property_evasion_constant
)
____exports.property_evasion_constant = property_evasion_constant
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
    return {MODIFIER_EVENT_ON_TAKEDAMAGE}
end
function property_lifesteal.prototype.OnTakeDamage(self, event)
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
