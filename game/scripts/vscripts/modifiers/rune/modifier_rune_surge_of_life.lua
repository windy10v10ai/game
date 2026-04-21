local ____lualib = require("lualib_bundle")
local __TS__Class = ____lualib.__TS__Class
local __TS__ClassExtends = ____lualib.__TS__ClassExtends
local __TS__DecorateLegacy = ____lualib.__TS__DecorateLegacy
local ____exports = {}
local ____dota_ts_adapter = require("utils.dota_ts_adapter")
local BaseModifier = ____dota_ts_adapter.BaseModifier
local registerModifier = ____dota_ts_adapter.registerModifier
LinkLuaModifier("modifier_rune_surge_of_life", "modifiers/rune/modifier_rune_surge_of_life", LUA_MODIFIER_MOTION_NONE)
____exports.SURGE_OF_LIFE_DURATION = 12
____exports.SURGE_DAMAGE_REDUCTION_PCT = -50
____exports.SURGE_PERSONAL_REGEN = 150
____exports.SURGE_ALLY_HEAL_PER_TICK = 150
____exports.SURGE_ALLY_HEAL_RADIUS = 600
____exports.SURGE_THINK_INTERVAL = 1
____exports.modifier_rune_surge_of_life = __TS__Class()
local modifier_rune_surge_of_life = ____exports.modifier_rune_surge_of_life
modifier_rune_surge_of_life.name = "modifier_rune_surge_of_life"
__TS__ClassExtends(modifier_rune_surge_of_life, BaseModifier)
function modifier_rune_surge_of_life.prototype.IsHidden(self)
    return false
end
function modifier_rune_surge_of_life.prototype.IsPurgable(self)
    return false
end
function modifier_rune_surge_of_life.prototype.IsDebuff(self)
    return false
end
function modifier_rune_surge_of_life.prototype.GetEffectName(self)
    return "particles/items2_fx/regeneration.vpcf"
end
function modifier_rune_surge_of_life.prototype.OnCreated(self)
    if IsServer() then
        local parent = self:GetParent()
        parent:SetHealth(parent:GetMaxHealth())
        parent:SetMana(parent:GetMaxMana())
    end
end
function modifier_rune_surge_of_life.prototype.DeclareFunctions(self)
    return {MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE, MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT}
end
function modifier_rune_surge_of_life.prototype.GetModifierIncomingDamage_Percentage(self)
    return ____exports.SURGE_DAMAGE_REDUCTION_PCT
end
function modifier_rune_surge_of_life.prototype.GetModifierConstantHealthRegen(self)
    return ____exports.SURGE_PERSONAL_REGEN
end
function modifier_rune_surge_of_life.prototype.GetModifierInterval(self)
    return ____exports.SURGE_THINK_INTERVAL
end
function modifier_rune_surge_of_life.prototype.OnIntervalThink(self)
    if not IsServer() then
        return
    end
    local parent = self:GetParent()
    local allies = FindUnitsInRadius(
        parent:GetTeamNumber(),
        parent:GetAbsOrigin(),
        nil,
        ____exports.SURGE_ALLY_HEAL_RADIUS,
        DOTA_UNIT_TARGET_TEAM_FRIENDLY,
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_NONE,
        FIND_ANY_ORDER,
        false
    )
    for ____, ally in ipairs(allies) do
        if ally ~= parent then
            ally:Heal(____exports.SURGE_ALLY_HEAL_PER_TICK, nil)
        end
    end
end
modifier_rune_surge_of_life = __TS__DecorateLegacy(
    {registerModifier(nil, "modifiers/rune/modifier_rune_surge_of_life")},
    modifier_rune_surge_of_life
)
____exports.modifier_rune_surge_of_life = modifier_rune_surge_of_life
return ____exports
