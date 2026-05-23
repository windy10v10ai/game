LinkLuaModifier("modifier_break_speed_limit", "abilities/break_speed_limit", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_break_speed_limit_stacks", "abilities/break_speed_limit", LUA_MODIFIER_MOTION_NONE)

break_speed_limit = class({})

function break_speed_limit:GetIntrinsicModifierName()
    return "modifier_break_speed_limit"
end

modifier_break_speed_limit = class({})

function modifier_break_speed_limit:IsHidden() return true end

function modifier_break_speed_limit:IsPurgable() return false end

function modifier_break_speed_limit:IsPermanent() return true end

function modifier_break_speed_limit:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_HERO_KILLED,
    }
end

function modifier_break_speed_limit:OnHeroKilled(keys)
    local parent = self:GetParent()
    if keys.attacker ~= parent or not keys.unit:IsRealHero() then return end

    -- 仅在攻速已达上限时才叠层
    if parent:GetAttackSpeed(false) < 7 then return end

    local ability = self:GetAbility()
    local duration = ability:GetSpecialValueFor("duration")
    local max_stacks = ability:GetSpecialValueFor("max_stacks")

    local current_stacks = parent:GetModifierStackCount("modifier_break_speed_limit_stacks", ability)
    if current_stacks == 0 then
        parent:AddNewModifier(parent, ability, "modifier_break_speed_limit_stacks", { duration = duration })
        current_stacks = 1
    else
        current_stacks = math.min(current_stacks + 1, max_stacks)
    end
    parent:SetModifierStackCount("modifier_break_speed_limit_stacks", ability, current_stacks)
end

modifier_break_speed_limit_stacks = class({})

function modifier_break_speed_limit_stacks:IsHidden() return false end

function modifier_break_speed_limit_stacks:IsDebuff() return false end

function modifier_break_speed_limit_stacks:IsPurgable() return false end

function modifier_break_speed_limit_stacks:OnCreated(kv)
    self.speed_per_stack = self:GetAbility():GetSpecialValueFor("speed_limit_per_stack")
    if IsServer() then
        self:SetDuration(self:GetAbility():GetSpecialValueFor("duration"), true)
    end
end

function modifier_break_speed_limit_stacks:OnStackCountChanged(oldStacks)
    if IsServer() then
        self:SetDuration(self:GetAbility():GetSpecialValueFor("duration"), true)
    end
end

function modifier_break_speed_limit_stacks:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_IGNORE_ATTACKSPEED_LIMIT,
        MODIFIER_PROPERTY_ATTACKSPEED_BASE_OVERRIDE,
    }
end

function modifier_break_speed_limit_stacks:GetModifierIgnoreAttackspeedLimit()
    return 1
end

function modifier_break_speed_limit_stacks:GetModifierAttackSpeedBaseOverride()
    return 7 + self:GetStackCount() * (self.speed_per_stack / 100)
end
