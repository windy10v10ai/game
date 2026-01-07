item_moon_shard_datadriven = class({})

-- Define constants here so we don't rely on the item handle (which might be destroyed)
local CONSUMED_BONUS_AS = 100
local CONSUMED_BONUS_NIGHT_VISION = 200
local CONSUMED_BONUS_DAY_VISION = 200

LinkLuaModifier("modifier_item_moon_shard_consumed_buff", "items/item_moon_shard", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_moon_shard_passive", "items/item_moon_shard", LUA_MODIFIER_MOTION_NONE)

function item_moon_shard_datadriven:GetIntrinsicModifierName()
    return "modifier_item_moon_shard_passive"
end

function item_moon_shard_datadriven:OnSpellStart()
    local caster = self:GetCaster()
    local target = self:GetCursorTarget()

    EmitSoundOnClient("Item.MoonShard.Consume", target)

    if target:IsRealHero() and not target:IsTempestDouble() then

        local modifier_name = "modifier_item_moon_shard_consumed_buff"
        local modifier = target:FindModifierByName(modifier_name)

        if modifier then
            modifier:IncrementStackCount()
        else
            target:AddNewModifier(caster, self, modifier_name, {})
            local new_mod = target:FindModifierByName(modifier_name)
            if new_mod then
                new_mod:SetStackCount(1)
            end
        end

        -- Spend 1 charge. If it reaches 0, the item entity is destroyed.
        self:SpendCharge(1)
    end
end

------------------------------------------------------------------------------------------------
-- Modifier: Consumed Buff (Permanent stats after eating)
------------------------------------------------------------------------------------------------
modifier_item_moon_shard_consumed_buff = class({})

function modifier_item_moon_shard_consumed_buff:IsHidden() return false end
function modifier_item_moon_shard_consumed_buff:IsPurgable() return false end
function modifier_item_moon_shard_consumed_buff:RemoveOnDeath() return false end
function modifier_item_moon_shard_consumed_buff:IsPermanent() return true end
function modifier_item_moon_shard_consumed_buff:GetTexture() return "item_moon_shard_datadriven" end

function modifier_item_moon_shard_consumed_buff:DeclareFunctions()
    local funcs = {
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_BONUS_NIGHT_VISION,
        MODIFIER_PROPERTY_BONUS_DAY_VISION,
        MODIFIER_PROPERTY_TOOLTIP
    }
    return funcs
end

-- FIXED: Use local constants instead of self:GetAbility():GetSpecialValueFor()
-- This ensures the stats remain even if the item is destroyed.
function modifier_item_moon_shard_consumed_buff:GetModifierAttackSpeedBonus_Constant()
    return CONSUMED_BONUS_AS * self:GetStackCount()
end

function modifier_item_moon_shard_consumed_buff:GetBonusNightVision()
    return CONSUMED_BONUS_NIGHT_VISION * self:GetStackCount()
end

function modifier_item_moon_shard_consumed_buff:GetBonusDayVision()
    return CONSUMED_BONUS_DAY_VISION * self:GetStackCount()
end

function modifier_item_moon_shard_consumed_buff:OnTooltip()
    return CONSUMED_BONUS_AS * self:GetStackCount()
end

------------------------------------------------------------------------------------------------
-- Modifier: Passive (Stats while holding the item in inventory)
------------------------------------------------------------------------------------------------
modifier_item_moon_shard_passive = class({})

function modifier_item_moon_shard_passive:IsHidden() return true end
function modifier_item_moon_shard_passive:IsPurgable() return false end
function modifier_item_moon_shard_passive:GetAttributes() return MODIFIER_ATTRIBUTE_MULTIPLE end

function modifier_item_moon_shard_passive:DeclareFunctions()
    local funcs = {
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_BONUS_NIGHT_VISION
    }
    return funcs
end

-- Note: It is safe to use GetAbility() here because this modifier ONLY exists
-- while the item exists in the inventory.
function modifier_item_moon_shard_passive:GetModifierAttackSpeedBonus_Constant()
    if self:GetAbility() then
        return self:GetAbility():GetSpecialValueFor("bonus_attack_speed")
    end
    return 0
end

function modifier_item_moon_shard_passive:GetBonusNightVision()
    if self:GetAbility() then
        return self:GetAbility():GetSpecialValueFor("bonus_night_vision")
    end
    return 0
end
