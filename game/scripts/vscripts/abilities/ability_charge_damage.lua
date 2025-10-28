LinkLuaModifier("modifier_ability_charge_damage_tracker", "abilities/ability_charge_damage", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_ability_charge_damage_amplify", "abilities/ability_charge_damage", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_ability_charge_damage_display", "abilities/ability_charge_damage", LUA_MODIFIER_MOTION_NONE)

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
    self.display_modifiers = {}

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

    local current_time = GameRules:GetGameTime()
    local max_times = ability:GetSpecialValueFor("max_times")

    -- 收集当前存在的技能名称
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

            -- 标记为当前存在的技能
            current_abilities[ability_name] = true

            if active_ability:IsCooldownReady() then
                -- 【修复】检查技能是否刚从冷却转为就绪
                -- 如果之前没有记录ready_time,或者上次检查时技能还在冷却中,则重置ready_time
                local was_on_cooldown = self.ability_last_cooldown_state and
                    self.ability_last_cooldown_state[ability_name]

                if not self.ability_charge_times[ability_name] then
                    self.ability_charge_times[ability_name] = 0
                end

                -- 如果技能刚从冷却转为就绪,重置ready_time
                if not self.ability_ready_times[ability_name] or was_on_cooldown then
                    self.ability_ready_times[ability_name] = current_time
                end

                local ready_duration = current_time - self.ability_ready_times[ability_name]
                local is_ultimate = (active_ability:GetAbilityType() == DOTA_ABILITY_TYPE_ULTIMATE)
                local ready_delay = is_ultimate and ability:GetSpecialValueFor("ultimate_ready_delay") or
                    ability:GetSpecialValueFor("normal_ready_delay")
                --print("cool-readydelay", is_ultimate, ready_delay)
                if ready_duration >= ready_delay then
                    self.ability_charge_times[ability_name] = self.ability_charge_times[ability_name] + 1
                end
                -- 记录当前技能是就绪状态
                if not self.ability_last_cooldown_state then
                    self.ability_last_cooldown_state = {}
                end
                self.ability_last_cooldown_state[ability_name] = false
            else
                self.ability_charge_times[ability_name] = 0
                self.ability_ready_times[ability_name] = nil

                -- 记录当前技能是冷却状态
                if not self.ability_last_cooldown_state then
                    self.ability_last_cooldown_state = {}
                end
                self.ability_last_cooldown_state[ability_name] = true
            end

            -- 更新或创建显示modifier
            local charge_time = self.ability_charge_times[ability_name] or 0
            if charge_time > 0 then
                local display_mod = self.display_modifiers[ability_name]

                if not display_mod or display_mod:IsNull() then
                    display_mod = caster:AddNewModifier(caster, ability, "modifier_ability_charge_damage_display", {
                        ability_name = ability_name
                    })
                    self.display_modifiers[ability_name] = display_mod
                end

                if display_mod and not display_mod:IsNull() then
                    -- 计算并存储当前伤害倍率
                    local total_cooldown = active_ability:GetCooldown(active_ability:GetLevel() - 1)
                    -- 获取所有冷却缩减效果
                    local cooldown_reduction = caster:GetCooldownReduction()
                    local actual_cooldown = math.max(total_cooldown * cooldown_reduction, 1.0)
                    -- 【新增】添加基础增幅倍率

                    local base_amplify = ability:GetSpecialValueFor("base_amplify")
                    --print("cool-base_amplifyit", base_amplify)
                    local damage_multiplier = base_amplify + (charge_time / actual_cooldown)
                    damage_multiplier = math.min(damage_multiplier, max_times)
                    --print("cool-damage_multiplierit", damage_multiplier)
                    -- 更新堆叠数显示
                    display_mod:SetStackCount(math.floor(damage_multiplier))
                    display_mod.damage_multiplier = damage_multiplier
                    display_mod.ability_name = ability_name
                end
            else
                -- 充能时间为0时移除显示modifier
                local display_mod = self.display_modifiers[ability_name]
                if display_mod and not display_mod:IsNull() then
                    display_mod:Destroy()
                end
                self.display_modifiers[ability_name] = nil
            end

            ::continue::
        end
    end

    -- 清理已移除技能的追踪数据和显示modifier
    for ability_name, _ in pairs(self.ability_charge_times) do
        if not current_abilities[ability_name] then
            self.ability_charge_times[ability_name] = nil
            self.ability_ready_times[ability_name] = nil
            self.ability_last_cooldown_state[ability_name] = nil -- 【新增】

            local display_mod = self.display_modifiers[ability_name]
            if display_mod and not display_mod:IsNull() then
                display_mod:Destroy()
            end
            self.display_modifiers[ability_name] = nil
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
    -- 【新增】添加基础增幅倍率
    local tracker_ability = self:GetAbility()
    local base_amplify = tracker_ability:GetSpecialValueFor("base_amplify")
    --print("cool-base_amplifyae", base_amplify)
    -- 获取技能冷却时间,最小值为1.0以防止除以零
    local total_cooldown = ability:GetCooldown(ability:GetLevel() - 1)
    -- 获取所有冷却缩减效果
    local cooldown_reduction = caster:GetCooldownReduction()
    local actual_cooldown = math.max(total_cooldown * cooldown_reduction, 1.0)
    local damage_multiplier = base_amplify + (charge_time / actual_cooldown)
    --print("cool-damage_multiplierae", damage_multiplier)
    local max_times = self:GetAbility():GetSpecialValueFor("max_times")
    if damage_multiplier > max_times then
        damage_multiplier = max_times
    end
    local amplify_duration = self:GetAbility():GetSpecialValueFor("amplify_duration")
    if amplify_duration <= 0 then
        amplify_duration = 3.0
    end
    self.ability_charge_times[ability_name] = 0
    self.ability_ready_times[ability_name] = nil

    -- 移除显示modifier
    local display_mod = self.display_modifiers[ability_name]
    if display_mod and not display_mod:IsNull() then
        display_mod:SetDuration(amplify_duration, true)
        -- 标记为已释放状态,可以在显示上做区分
        display_mod.is_active = true
    end
    self.display_modifiers[ability_name] = nil

    caster:AddNewModifier(caster, self:GetAbility(), "modifier_ability_charge_damage_amplify", {
        duration = amplify_duration,
        damage_multiplier_int = math.floor(damage_multiplier * 100),
        ability_name = ability_name,
        cast_time = GameRules:GetGameTime()
    })
end

--------------------------------------------------------------------------------
-- 充能显示修饰符
--------------------------------------------------------------------------------
modifier_ability_charge_damage_display = class({})

function modifier_ability_charge_damage_display:IsHidden()
    return false
end

function modifier_ability_charge_damage_display:IsDebuff()
    return false
end

function modifier_ability_charge_damage_display:IsPurgable()
    return false
end

function modifier_ability_charge_damage_display:GetAttributes()
    return MODIFIER_ATTRIBUTE_MULTIPLE
end

function modifier_ability_charge_damage_display:OnCreated(params)
    if IsServer() then
        self.ability_name = params.ability_name
        self.damage_multiplier = 1.0
        self:SetHasCustomTransmitterData(true)
    end
end

function modifier_ability_charge_damage_display:AddCustomTransmitterData()
    return {
        ability_name = self.ability_name,
        damage_multiplier = math.floor((self.damage_multiplier or 1.0) * 100)
    }
end

function modifier_ability_charge_damage_display:HandleCustomTransmitterData(data)
    self.ability_name = data.ability_name
    self.damage_multiplier = (data.damage_multiplier or 100) / 100.0
end

function modifier_ability_charge_damage_display:GetTexture()
    return self.ability_name or "default"
end

function modifier_ability_charge_damage_display:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_TOOLTIP,
        MODIFIER_PROPERTY_TOOLTIP2,
    }
end

function modifier_ability_charge_damage_display:OnTooltip()
    return self:GetStackCount()
end

function modifier_ability_charge_damage_display:OnTooltip2()
    return math.floor((self.damage_multiplier or 1.0) * 100)
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

function modifier_ability_charge_damage_amplify:GetAttributes()
    return MODIFIER_ATTRIBUTE_MULTIPLE -- 【新增】允许多个实例
end

function modifier_ability_charge_damage_amplify:OnCreated(params)
    if IsServer() then
        self.damage_multiplier = (params.damage_multiplier_int or 100) / 100.0
        --print("cool-damage_multiplierdm", self.damage_multiplier)
        self.ability_name = params.ability_name
        self.cast_time = params.cast_time or GameRules:GetGameTime()
    end
end

function modifier_ability_charge_damage_amplify:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_TOTALDAMAGEOUTGOING_PERCENTAGE,
    }
end

function modifier_ability_charge_damage_amplify:GetModifierTotalDamageOutgoing_Percentage(params)
    if not IsServer() then return 0 end

    -- 只对匹配的技能生效
    if params.inflictor and params.inflictor:GetAbilityName() == self.ability_name then
        -- 返回百分比增幅 (例如 2.0 倍 = 100% 增幅)
        return (self.damage_multiplier - 1.0) * 100
    end

    return 0
end
