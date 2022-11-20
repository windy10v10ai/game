local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__Decorate = ____lualib.__TS__Decorate
local __TS__SourceMapTraceBack = ____lualib.__TS__SourceMapTraceBack
__TS__SourceMapTraceBack(debug.getinfo(1).short_src, {["8"] = 1,["9"] = 1,["10"] = 2,["11"] = 2,["12"] = 4,["13"] = 5,["14"] = 4,["15"] = 5,["16"] = 6,["17"] = 7,["18"] = 6,["19"] = 9,["20"] = 10,["21"] = 9,["22"] = 5,["23"] = 4,["24"] = 5,["26"] = 5,["27"] = 14,["28"] = 15,["29"] = 14,["30"] = 15,["31"] = 16,["32"] = 17,["33"] = 16,["34"] = 19,["35"] = 20,["36"] = 19,["37"] = 15,["38"] = 14,["39"] = 15,["41"] = 15,["42"] = 25,["43"] = 26,["44"] = 25,["45"] = 26,["46"] = 27,["47"] = 28,["48"] = 27,["49"] = 30,["50"] = 31,["51"] = 30,["52"] = 26,["53"] = 25,["54"] = 26,["56"] = 26,["57"] = 35,["58"] = 36,["59"] = 35,["60"] = 36,["61"] = 37,["62"] = 38,["63"] = 37,["64"] = 40,["65"] = 41,["66"] = 40,["67"] = 36,["68"] = 35,["69"] = 36,["71"] = 36,["72"] = 45,["73"] = 46,["74"] = 45,["75"] = 46,["76"] = 47,["77"] = 48,["78"] = 47,["79"] = 50,["80"] = 51,["81"] = 50,["82"] = 46,["83"] = 45,["84"] = 46,["86"] = 46,["87"] = 55,["88"] = 56,["89"] = 55,["90"] = 56,["91"] = 57,["92"] = 58,["93"] = 57,["94"] = 60,["95"] = 61,["96"] = 62,["97"] = 63,["99"] = 65,["100"] = 60,["101"] = 56,["102"] = 55,["103"] = 56,["105"] = 56,["106"] = 69,["107"] = 70,["108"] = 69,["109"] = 70,["110"] = 71,["111"] = 72,["112"] = 71,["113"] = 74,["114"] = 75,["115"] = 74,["116"] = 70,["117"] = 69,["118"] = 70,["120"] = 70,["121"] = 79,["122"] = 80,["123"] = 79,["124"] = 80,["125"] = 81,["126"] = 82,["127"] = 81,["128"] = 84,["129"] = 85,["130"] = 84,["131"] = 80,["132"] = 79,["133"] = 80,["135"] = 80,["136"] = 89,["137"] = 90,["138"] = 89,["139"] = 90,["140"] = 91,["141"] = 92,["142"] = 91,["143"] = 94,["144"] = 95,["145"] = 94,["146"] = 90,["147"] = 89,["148"] = 90,["150"] = 90,["151"] = 99,["152"] = 100,["153"] = 99,["154"] = 100,["155"] = 101,["156"] = 102,["157"] = 101,["158"] = 104,["159"] = 105,["160"] = 104,["161"] = 100,["162"] = 99,["163"] = 100,["165"] = 100,["166"] = 109,["167"] = 110,["168"] = 109,["169"] = 110,["170"] = 111,["171"] = 112,["172"] = 111,["173"] = 114,["174"] = 115,["175"] = 114,["176"] = 110,["177"] = 109,["178"] = 110,["180"] = 110,["181"] = 119,["182"] = 120,["183"] = 119,["184"] = 120,["185"] = 121,["186"] = 122,["187"] = 121,["188"] = 124,["189"] = 125,["190"] = 124,["191"] = 120,["192"] = 119,["193"] = 120,["195"] = 120,["196"] = 129,["197"] = 130,["198"] = 129,["199"] = 130,["200"] = 131,["201"] = 132,["202"] = 131,["203"] = 134,["204"] = 135,["205"] = 134,["206"] = 130,["207"] = 129,["208"] = 130,["210"] = 130,["211"] = 139,["212"] = 140,["213"] = 139,["214"] = 140,["215"] = 141,["216"] = 142,["217"] = 141,["218"] = 144,["219"] = 145,["220"] = 144,["221"] = 140,["222"] = 139,["223"] = 140,["225"] = 140,["226"] = 150,["227"] = 151,["228"] = 150,["229"] = 151,["230"] = 152,["231"] = 153,["232"] = 152,["233"] = 155,["234"] = 157,["235"] = 157,["236"] = 157,["237"] = 157,["238"] = 157,["239"] = 157,["240"] = 157,["241"] = 155,["242"] = 151,["243"] = 150,["244"] = 151,["246"] = 151,["247"] = 162,["248"] = 163,["249"] = 162,["250"] = 163,["251"] = 164,["252"] = 165,["253"] = 164,["254"] = 167,["255"] = 169,["256"] = 167,["257"] = 163,["258"] = 162,["259"] = 163,["261"] = 163,["262"] = 173,["263"] = 174,["264"] = 173,["265"] = 174,["266"] = 175,["267"] = 176,["268"] = 175,["269"] = 178,["270"] = 179,["271"] = 178,["272"] = 174,["273"] = 173,["274"] = 174,["276"] = 174,["277"] = 183,["278"] = 184,["279"] = 183,["280"] = 184,["281"] = 185,["282"] = 186,["283"] = 185,["284"] = 191,["285"] = 192,["286"] = 191,["287"] = 194,["288"] = 195,["289"] = 194,["290"] = 184,["291"] = 183,["292"] = 184,["294"] = 184,["295"] = 199,["296"] = 200,["297"] = 199,["298"] = 200,["299"] = 201,["300"] = 202,["301"] = 201,["302"] = 200,["303"] = 199,["304"] = 200,["306"] = 200});
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
