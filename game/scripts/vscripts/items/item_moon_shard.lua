item_moon_shard_datadriven = class({})

-- Link both modifiers: the permanent buff (consumed) and the passive item bonus (holding)
LinkLuaModifier("modifier_item_moon_shard_consumed_buff", "items/item_moon_shard", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_moon_shard_passive", "items/item_moon_shard", LUA_MODIFIER_MOTION_NONE)

-- This function applies the passive modifier when the item is in the inventory
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
    return {
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_BONUS_NIGHT_VISION,
        MODIFIER_PROPERTY_BONUS_DAY_VISION,
        MODIFIER_PROPERTY_TOOLTIP
    }
end

function modifier_item_moon_shard_consumed_buff:GetModifierAttackSpeedBonus_Constant()
    -- 100 AS per stack
    return self:GetAbility():GetSpecialValueFor("consumed_bonus_attack_speed") * self:GetStackCount()
end

function modifier_item_moon_shard_consumed_buff:GetBonusNightVision()
    -- 200 Vision per stack
    return self:GetAbility():GetSpecialValueFor("consumed_bonus_night_vision") * self:GetStackCount()
end

function modifier_item_moon_shard_consumed_buff:GetBonusDayVision()
    -- 200 Vision per stack
    return self:GetAbility():GetSpecialValueFor("consumed_bonus_day_vision") * self:GetStackCount()
end

function modifier_item_moon_shard_consumed_buff:OnTooltip()
    return self:GetAbility():GetSpecialValueFor("consumed_bonus_attack_speed") * self:GetStackCount()
end

------------------------------------------------------------------------------------------------
-- Modifier: Passive (Stats while holding the item)
------------------------------------------------------------------------------------------------
modifier_item_moon_shard_passive = class({})

-- Passive modifiers on items are usually hidden (the item icon itself shows the stats)
function modifier_item_moon_shard_passive:IsHidden() return true end
function modifier_item_moon_shard_passive:IsPurgable() return false end
function modifier_item_moon_shard_passive:GetAttributes() return MODIFIER_ATTRIBUTE_MULTIPLE end

function modifier_item_moon_shard_passive:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_BONUS_NIGHT_VISION
    }
end

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
