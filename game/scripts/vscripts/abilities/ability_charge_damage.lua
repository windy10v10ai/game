LinkLuaModifier("modifier_ability_charge_damage_tracker", "abilities/ability_charge_damage", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_ability_charge_damage_amplify", "abilities/ability_charge_damage", LUA_MODIFIER_MOTION_NONE)

ability_charge_damage = class({})

function ability_charge_damage:GetIntrinsicModifierName()
    return "modifier_ability_charge_damage_tracker"
end

--------------------------------------------------------------------------------
-- 充能追踪修饰符
--------------------------------------------------------------------------------
modifier_ability_charge_damage_tracker = class({})

function modifier_ability_charge_damage_tracker:IsHidden()
    return true
end

function modifier_ability_charge_damage_tracker:IsDebuff()
    return false
end

function modifier_ability_charge_damage_tracker:IsPurgable()
    return false
end

function modifier_ability_charge_damage_tracker:RemoveOnDeath()
    return false
end

function modifier_ability_charge_damage_tracker:OnCreated()
    if not IsServer() then return end

    self.ability_charge_times = {}
    self.ability_ready_times = {}

    self.utility_abilities = {
        ["ability_capture"] = true,
        ["ability_lamp_use"] = true,
        ["twin_gate_portal_warp"] = true,
        ["abyssal_underlord_portal_warp"] = true,
    }

    self:StartIntervalThink(1.0)
end

function modifier_ability_charge_damage_tracker:OnIntervalThink()
    if not IsServer() then return end

    local caster = self:GetParent()
    local ability = self:GetAbility()
    local ready_delay = ability:GetSpecialValueFor("ready_delay")
    local current_time = GameRules:GetGameTime()

    -- 【新增】收集当前存在的技能名称
    local current_abilities = {}

    for i = 0, caster:GetAbilityCount() - 1 do
        local active_ability = caster:GetAbilityByIndex(i)
        if active_ability and active_ability:GetLevel() > 0
            and not active_ability:IsPassive()
            and not active_ability:IsItem()
            and active_ability ~= ability then
            local ability_name = active_ability:GetAbilityName()

            if self.utility_abilities[ability_name] then
                goto continue
            end

            local ability_damage_type = active_ability:GetAbilityDamageType()
            if ability_damage_type == DAMAGE_TYPE_NONE then
                goto continue
            end

            -- 【新增】标记为当前存在的技能
            current_abilities[ability_name] = true

            if active_ability:IsCooldownReady() then
                if not self.ability_charge_times[ability_name] then
                    self.ability_charge_times[ability_name] = 0
                end
                if not self.ability_ready_times[ability_name] then
                    self.ability_ready_times[ability_name] = current_time
                end

                local ready_duration = current_time - self.ability_ready_times[ability_name]

                if ready_duration >= ready_delay then
                    self.ability_charge_times[ability_name] = self.ability_charge_times[ability_name] + 1
                end
            else
                self.ability_charge_times[ability_name] = 0
                self.ability_ready_times[ability_name] = nil
            end

            ::continue::
        end
    end

    -- 【新增】清理已移除技能的追踪数据
    for ability_name, _ in pairs(self.ability_charge_times) do
        if not current_abilities[ability_name] then
            self.ability_charge_times[ability_name] = nil
            self.ability_ready_times[ability_name] = nil
        end
    end
end

function modifier_ability_charge_damage_tracker:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ABILITY_EXECUTED,
    }
end

function modifier_ability_charge_damage_tracker:OnAbilityExecuted(keys)
    if not IsServer() then return end

    if keys.unit ~= self:GetParent() then
        return
    end

    local ability = keys.ability
    local caster = self:GetParent()
    local ability_name = ability:GetAbilityName()

    if ability:IsPassive() or ability:IsItem() or ability == self:GetAbility() then
        return
    end

    local charge_time = self.ability_charge_times[ability_name] or 0

    if charge_time <= 0 then
        return
    end

    -- 获取技能冷却时间,最小值为1.0以防止除以零
    local total_cooldown = ability:GetCooldown(ability:GetLevel() - 1)
    total_cooldown = math.max(total_cooldown, 1.0)

    local damage_multiplier = 1.0 + (charge_time / total_cooldown)

    local max_times = self:GetAbility():GetSpecialValueFor("max_times")
    if damage_multiplier > max_times then
        damage_multiplier = max_times
    end

    self.ability_charge_times[ability_name] = 0
    self.ability_ready_times[ability_name] = nil

    local amplify_duration = self:GetAbility():GetSpecialValueFor("amplify_duration")
    if amplify_duration <= 0 then
        amplify_duration = 2.0
    end

    caster:AddNewModifier(caster, self:GetAbility(), "modifier_ability_charge_damage_amplify", {
        duration = amplify_duration,
        damage_multiplier_int = math.floor(damage_multiplier * 100),
        ability_name = ability_name,
        cast_time = GameRules:GetGameTime()
    })
end

--------------------------------------------------------------------------------
-- 伤害增幅修饰符
--------------------------------------------------------------------------------
modifier_ability_charge_damage_amplify = class({})

function modifier_ability_charge_damage_amplify:IsHidden()
    return true
end

function modifier_ability_charge_damage_amplify:IsDebuff()
    return false
end

function modifier_ability_charge_damage_amplify:IsPurgable()
    return false
end

function modifier_ability_charge_damage_amplify:OnCreated(params)
    if IsServer() then
        self.damage_multiplier = (params.damage_multiplier_int or 100) / 100.0
        self.ability_name = params.ability_name
        self.cast_time = params.cast_time or GameRules:GetGameTime()
        self.damage_applied = false
    end
end

function modifier_ability_charge_damage_amplify:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_TOTALDAMAGEOUTGOING_PERCENTAGE,
    }
end

function modifier_ability_charge_damage_amplify:GetModifierTotalDamageOutgoing_Percentage(params)
    if not IsServer() then return 0 end

    -- 检查是否已经应用过
    if self.damage_applied then
        return 0
    end

    -- 只对匹配的技能生效
    if params.inflictor and params.inflictor:GetAbilityName() == self.ability_name then
        self.damage_applied = true
        -- 在下一帧销毁修饰符
        Timers:CreateTimer(FrameTime(), function()
            if not self:IsNull() then
                self:Destroy()
            end
        end)
        -- 返回百分比增幅 (例如 2.0 倍 = 100% 增幅)
        return (self.damage_multiplier - 1.0) * 100
    end

    return 0
end
