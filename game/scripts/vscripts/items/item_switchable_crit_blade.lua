item_switchable_crit_blade = class({})

function item_switchable_crit_blade:GetIntrinsicModifierName()
    return "modifier_item_switchable_crit_blade"
end

function item_switchable_crit_blade:IsRefreshable()
    return false
end

function item_switchable_crit_blade:OnSpellStart()
    local caster = self:GetCaster()
    local modifier = caster:FindModifierByName("modifier_item_switchable_crit_blade")

    if not modifier then return end
    if modifier.is_on_cooldown then return end

    local current_mode = modifier:GetStackCount()
    if current_mode == 0 then current_mode = 1 end

    current_mode = current_mode + 1
    if current_mode > 3 then current_mode = 1 end

    modifier:SetStackCount(current_mode)
    self:SetSecondaryCharges(current_mode) -- 新增:保存到物品
    EmitSoundOn("Item.ToggleOn", caster)
end

function item_switchable_crit_blade:GetCooldown(level)
    local caster = self:GetCaster()
    if not caster then return 0 end

    local modifier = caster:FindModifierByName("modifier_item_switchable_crit_blade")
    if modifier then
        local mode = modifier:GetStackCount()
        if mode == 0 then mode = 1 end
        return self:GetSpecialValueFor("cooldown_mode" .. mode)
    end
    return 0
end

LinkLuaModifier("modifier_item_switchable_crit_blade", "items/item_switchable_crit_blade", LUA_MODIFIER_MOTION_NONE)

modifier_item_switchable_crit_blade = class({})

function modifier_item_switchable_crit_blade:IsHidden()
    return false
end

function modifier_item_switchable_crit_blade:IsPurgable()
    return false
end

function modifier_item_switchable_crit_blade:RemoveOnDeath()
    return false
end

function modifier_item_switchable_crit_blade:GetAttributes()
    return MODIFIER_ATTRIBUTE_MULTIPLE
end

function modifier_item_switchable_crit_blade:GetModifierPriority()
    return MODIFIER_PRIORITY_SUPER_ULTRA
end

function modifier_item_switchable_crit_blade:OnCreated(params)
    local ability = self:GetAbility()
    if not ability then return end

    -- 缓存被动属性值
    self.bonus_damage = ability:GetSpecialValueFor("bonus_damage")
    self.bonus_spell_amp = ability:GetSpecialValueFor("bonus_spell_amp")
    self.bonus_damage_percent = ability:GetSpecialValueFor("bonus_damage_percent")
    self.bonus_agility = ability:GetSpecialValueFor("bonus_agility")
    self.bonus_evasion = ability:GetSpecialValueFor("bonus_evasion")
    self.bonus_attack_speed = ability:GetSpecialValueFor("bonus_attack_speed")

    if IsServer() then
        -- 从物品的secondary charges读取保存的模式
        local saved_mode = ability:GetSecondaryCharges()
        if saved_mode > 0 and saved_mode <= 3 then
            self:SetStackCount(saved_mode)
        elseif self:GetStackCount() == 0 then
            self:SetStackCount(1)
            ability:SetSecondaryCharges(1)
        end

        -- 检查是否有剩余冷却
        local remaining_cooldown = ability:GetCooldownTimeRemaining()
        if remaining_cooldown > 0 then
            self.has_guaranteed_crit = false
            self.is_on_cooldown = true
            self:StartIntervalThink(remaining_cooldown)
        else
            -- 刚装备时,应该立即可用
            self.has_guaranteed_crit = true
            self.is_on_cooldown = false
        end
    end
end

function modifier_item_switchable_crit_blade:OnDestroy()
    -- 属性已迁移到 Lua modifier 实现
end

function modifier_item_switchable_crit_blade:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ATTACK_LANDED,
        MODIFIER_PROPERTY_TOOLTIP,
        MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE,
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
        MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE,
        MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
        MODIFIER_PROPERTY_EVASION_CONSTANT,
        MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
    }
end

function modifier_item_switchable_crit_blade:OnTooltip()
    return self:GetStackCount()
end

-- ========================================
-- 被动属性实现（Lua modifier）
-- ========================================

function modifier_item_switchable_crit_blade:GetModifierPreAttack_BonusDamage()
    return self.bonus_damage or 0
end

function modifier_item_switchable_crit_blade:GetModifierSpellAmplify_Percentage()
    return self.bonus_spell_amp or 0
end

function modifier_item_switchable_crit_blade:GetModifierBaseDamageOutgoing_Percentage()
    return self.bonus_damage_percent or 0
end

function modifier_item_switchable_crit_blade:GetModifierAgilityBonus()
    return self.bonus_agility or 0
end

function modifier_item_switchable_crit_blade:GetModifierEvasion_Constant()
    return self.bonus_evasion or 0
end

function modifier_item_switchable_crit_blade:GetModifierAttackSpeedBonus_Constant()
    return self.bonus_attack_speed or 0
end

function modifier_item_switchable_crit_blade:GetModifierPreAttack_CriticalStrike(params)
    if not IsServer() then return 0 end

    local ability = self:GetAbility()
    if not ability then return 0 end

    local mode = self:GetStackCount()
    if mode == 0 then mode = 1 end

    -- 优先检查必然暴击
    if self.has_guaranteed_crit then
        local guaranteed_multiplier = ability:GetSpecialValueFor("guaranteed_crit_multiplier_mode" .. mode)
        self.triggered_guaranteed_crit = true
        self.triggered_chance_crit = false -- 新增
        return guaranteed_multiplier * 100
    end

    -- 概率暴击判定
    local crit_chance = ability:GetSpecialValueFor("crit_chance_mode" .. mode)
    local crit_multiplier = ability:GetSpecialValueFor("crit_multiplier_mode" .. mode)

    if RandomFloat(0, 100) <= crit_chance then
        self.triggered_guaranteed_crit = false
        self.triggered_chance_crit = true -- 新增
        return crit_multiplier * 100
    end

    self.triggered_chance_crit = false -- 新增
    return 0
end

function modifier_item_switchable_crit_blade:OnAttackLanded(params)
    if not IsServer() then return end
    if params.attacker ~= self:GetParent() then return end

    -- 处理必然暴击
    if self.triggered_guaranteed_crit then
        self.has_guaranteed_crit = false
        self.is_on_cooldown = true
        self.triggered_guaranteed_crit = false

        local mode = self:GetStackCount()
        if mode == 0 then mode = 1 end

        local cooldown = self:GetAbility():GetSpecialValueFor("cooldown_mode" .. mode)
        self:GetAbility():StartCooldown(cooldown)

        EmitSoundOn("Hero_Brewmaster.Brawler.Crit", params.target)

        self:StartIntervalThink(cooldown)
    end

    -- 处理概率暴击 (新增)
    if self.triggered_chance_crit then
        EmitSoundOn("Hero_Brewmaster.Brawler.Crit", params.target)
        self.triggered_chance_crit = false
    end
end

function modifier_item_switchable_crit_blade:OnIntervalThink()
    if IsServer() then
        self.has_guaranteed_crit = true
        self.is_on_cooldown = false
        self:StartIntervalThink(-1)
    end
end

function modifier_item_switchable_crit_blade:GetTexture()
    return "guihaiyidao"
end
