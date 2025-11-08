LinkLuaModifier("modifier_item_beast_shield_active", "items/item_beast_shield.lua", LUA_MODIFIER_MOTION_NONE)

function BeastShieldOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    caster:AddNewModifier(caster, ability, "modifier_item_eternal_shroud", {})
end

function BeastShieldOnDestroy(keys)
    if not IsServer() then return end

    local caster = keys.caster

    if not caster then return end

    caster:RemoveModifierByName("modifier_item_eternal_shroud")
end

function OnSpellStart(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    local duration = ability:GetSpecialValueFor("active_duration")

    EmitSoundOn("DOTA_Item.BladeMail.Activate", caster)
    caster:AddNewModifier(caster, ability, "modifier_item_beast_shield_active", { duration = duration })
end

modifier_item_beast_shield_active = class({})

function modifier_item_beast_shield_active:IsHidden() return false end

function modifier_item_beast_shield_active:IsPurgable() return false end

function modifier_item_beast_shield_active:CheckState()
    return {
        [MODIFIER_STATE_DISARMED] = true,
        [MODIFIER_STATE_ROOTED] = true,
    }
end

function modifier_item_beast_shield_active:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
        MODIFIER_PROPERTY_HEALTH_BONUS,
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
        MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
        MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
        MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
    }
end

function modifier_item_beast_shield_active:GetModifierBonusStats_Strength()
    local base = self:GetAbility():GetSpecialValueFor("bonus_strength")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetModifierHealthBonus()
    local base = self:GetAbility():GetSpecialValueFor("bonus_health")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetModifierPhysicalArmorBonus()
    local base = self:GetAbility():GetSpecialValueFor("bonus_armor")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetModifierMagicalResistanceBonus()
    local base = self:GetAbility():GetSpecialValueFor("bonus_spell_resist")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetModifierConstantHealthRegen()
    local base = self:GetAbility():GetSpecialValueFor("bonus_health_regen")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetModifierConstantManaRegen()
    local base = self:GetAbility():GetSpecialValueFor("bonus_mana_regen")
    local multiplier = self:GetAbility():GetSpecialValueFor("active_bonus_multiplier") / 100
    return base * multiplier
end

function modifier_item_beast_shield_active:GetTexture()
    return "item_beast_shield"
end

function modifier_item_beast_shield_active:GetEffectName()
    return "particles/items_fx/immunity_sphere.vpcf"
end

function modifier_item_beast_shield_active:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end
