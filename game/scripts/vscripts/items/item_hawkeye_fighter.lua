item_hawkeye_fighter = class({})

LinkLuaModifier("modifier_item_hawkeye_fighter", "items/item_hawkeye_fighter", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_hawkeye_fighter_active", "items/item_hawkeye_fighter", LUA_MODIFIER_MOTION_NONE)

function item_hawkeye_fighter:GetIntrinsicModifierName()
    return "modifier_item_hawkeye_fighter"
end

function item_hawkeye_fighter:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("active_duration")

    caster:AddNewModifier(caster, self, "modifier_item_hawkeye_fighter_active", { duration = duration })
    caster:Purge(false, true, false, false, false)

    EmitSoundOn("DOTA_Item.ForceStaff.Activate", caster)
end

-- 被动modifier
modifier_item_hawkeye_fighter = class({})

function modifier_item_hawkeye_fighter:IsHidden() return true end

function modifier_item_hawkeye_fighter:IsPurgable() return false end

function modifier_item_hawkeye_fighter:RemoveOnDeath() return false end

function modifier_item_hawkeye_fighter:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_hawkeye_fighter:OnCreated(params)
    self:OnRefresh(params)
end

function modifier_item_hawkeye_fighter:OnRefresh(params)
    self.stats_modifier_name = "modifier_item_hawkeye_fighter_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_hawkeye_fighter:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

-- 主动modifier
modifier_item_hawkeye_fighter_active = class({})

function modifier_item_hawkeye_fighter_active:IsHidden() return false end

function modifier_item_hawkeye_fighter_active:IsPurgable() return true end

function modifier_item_hawkeye_fighter_active:IsBuff() return true end

function modifier_item_hawkeye_fighter_active:OnCreated()
    local ability = self:GetAbility()

    if IsServer() then
        if ability then
            self.active_movespeed_bonus = ability:GetSpecialValueFor("active_movement_speed_pct") or 150
        end
        self:SetHasCustomTransmitterData(true)
    end
end

function modifier_item_hawkeye_fighter_active:AddCustomTransmitterData()
    return { active_movespeed_bonus = self.active_movespeed_bonus }
end

function modifier_item_hawkeye_fighter_active:HandleCustomTransmitterData(data)
    self.active_movespeed_bonus = data.active_movespeed_bonus
end

function modifier_item_hawkeye_fighter_active:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
    }
end

function modifier_item_hawkeye_fighter_active:GetModifierMoveSpeedBonus_Percentage()
    return self.active_movespeed_bonus or 0
end

function modifier_item_hawkeye_fighter_active:GetModifierIgnoreMovespeedLimit()
    return 1
end

function modifier_item_hawkeye_fighter_active:CheckState()
    return {
        [MODIFIER_STATE_NO_UNIT_COLLISION] = true,
        [MODIFIER_STATE_FLYING] = true,
        [MODIFIER_STATE_FORCED_FLYING_VISION] = true,
    }
end

function modifier_item_hawkeye_fighter_active:GetEffectName()
    return "particles/econ/events/ti10/phase_boots_ti10.vpcf"
end

function modifier_item_hawkeye_fighter_active:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end
