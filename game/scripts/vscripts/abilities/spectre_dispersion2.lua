-- 技能主体定义
spectre_dispersion2 = class({})
LinkLuaModifier("modifier_spectre_dispersion2", "abilities/spectre_dispersion2", LUA_MODIFIER_MOTION_NONE)

function spectre_dispersion2:GetIntrinsicModifierName()
    return "modifier_spectre_dispersion2"
end

-- modifier 定义
modifier_spectre_dispersion2 = class({})

function modifier_spectre_dispersion2:IsHidden() return true end

function modifier_spectre_dispersion2:IsPurgable() return false end

function modifier_spectre_dispersion2:OnCreated()
    if IsServer() then
        -- 分别累积不同类型的伤害
        self.accumulated_damage = {
            [DAMAGE_TYPE_PHYSICAL] = 0,
            [DAMAGE_TYPE_MAGICAL] = 0,
            [DAMAGE_TYPE_PURE] = 0,
        }
        self.is_timer_active = false
    end
end

function modifier_spectre_dispersion2:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
    }
end

function modifier_spectre_dispersion2:GetModifierIncomingDamage_Percentage(keys)
    if IsServer() then
        if keys.target == self:GetParent() then
            local damage = keys.original_damage
            if damage >= self:GetAbility():GetSpecialValueFor("threshold") then
                local damage_reduction = self:GetAbility():GetSpecialValueFor("damage_reduction")
                if self:GetParent():IsRealHero() then
                    if bit.band(keys.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) ~= DOTA_DAMAGE_FLAG_REFLECTION then
                        -- 计算反射的伤害量（税前伤害的百分比）
                        local reflected_damage = damage * damage_reduction / 100

                        -- 根据伤害类型分别累积
                        local damage_type = keys.damage_type or DAMAGE_TYPE_PHYSICAL
                        self.accumulated_damage[damage_type] = (self.accumulated_damage[damage_type] or 0) +
                            reflected_damage

                        -- 启动定时器
                        if not self.is_timer_active then
                            self.is_timer_active = true
                            Timers:CreateTimer(1, function()
                                self:ReleaseAccumulatedDamage()
                                return nil
                            end)
                        end
                    end
                end

                return -damage_reduction
            else
                return 0
            end
        else
            return 0
        end
    end
end

function modifier_spectre_dispersion2:ReleaseAccumulatedDamage()
    if not IsServer() then return end

    local caster = self:GetParent()
    local ability = self:GetAbility()
    local radius = ability:GetSpecialValueFor("radius")

    -- 找到范围内所有敌人
    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(),
        caster:GetAbsOrigin(),
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,
        FIND_ANY_ORDER,
        false
    )

    -- 先遍历敌人，再遍历伤害类型（性能优化：距离只计算一次）
    for _, enemy in pairs(enemies) do
        if enemy and IsValidEntity(enemy) and enemy:IsAlive() then
            local distance = (enemy:GetAbsOrigin() - caster:GetAbsOrigin()):Length2D()

            -- 计算距离衰减
            local distance_multiplier = 1.0
            if distance > 300 then
                local extra_distance = distance - 300
                local reduction_steps = math.floor(extra_distance / 100)
                distance_multiplier = math.max(0, 1.0 - (reduction_steps * 0.2))
            end

            -- 对每种伤害类型分别造成伤害
            for damage_type, total_damage in pairs(self.accumulated_damage) do
                if total_damage > 0 then
                    local final_damage = total_damage * distance_multiplier

                    if final_damage > 0 then
                        -- 使用与接收伤害相同的类型释放
                        ApplyDamage({
                            victim = enemy,
                            attacker = caster,
                            damage = final_damage,
                            damage_type = damage_type,
                            ability = ability,
                            damage_flags = DOTA_DAMAGE_FLAG_REFLECTION +
                                DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL
                        })
                    end
                end
            end
        end
    end

    -- 重置累积数据
    self.accumulated_damage = {
        [DAMAGE_TYPE_PHYSICAL] = 0,
        [DAMAGE_TYPE_MAGICAL] = 0,
        [DAMAGE_TYPE_PURE] = 0,
    }
    self.is_timer_active = false
end
