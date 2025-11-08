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
        -- 简化:只累积总伤害值
        self.accumulated_damage = 0
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
            if keys.original_damage >= 100 then
                local damage_reduction = self:GetAbility():GetSpecialValueFor("damage_reduction")
                if self:GetParent():IsRealHero() then
                    if bit.band(keys.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) ~= DOTA_DAMAGE_FLAG_REFLECTION then
                        -- 累积总伤害(减免前的伤害)
                        local reduced_damage = keys.original_damage * damage_reduction / 100
                        self.accumulated_damage = self.accumulated_damage + reduced_damage

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
    local radius = 800

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

    -- 对每个敌人造成纯粹伤害
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

            -- 计算最终伤害
            local final_damage = self.accumulated_damage * distance_multiplier

            if final_damage > 0 then
                -- 以纯粹伤害形式释放
                ApplyDamage({
                    victim = enemy,
                    attacker = caster,
                    damage = final_damage,
                    damage_type = DAMAGE_TYPE_PURE,
                    ability = ability,
                    damage_flags = DOTA_DAMAGE_FLAG_REFLECTION +
                        DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL +
                        DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
                })
            end
        end
    end

    -- 重置累积数据
    self.accumulated_damage = 0
    self.is_timer_active = false
end
