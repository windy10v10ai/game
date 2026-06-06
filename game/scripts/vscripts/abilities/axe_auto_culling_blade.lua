LinkLuaModifier("modifier_axe_auto_culling_blade", "abilities/axe_auto_culling_blade", LUA_MODIFIER_MOTION_NONE)

axe_auto_culling_blade = axe_auto_culling_blade or class({})
modifier_axe_auto_culling_blade = modifier_axe_auto_culling_blade or class({})

function axe_auto_culling_blade:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("duration")

    -- 添加持续时间buff
    caster:AddNewModifier(caster, self, "modifier_axe_auto_culling_blade", { duration = duration })

    -- 播放音效
    caster:EmitSound("Hero_Axe.Berserkers_Call")

    --print("[Axe Auto Culling] 技能激活, 持续时间:", duration)
end

-- Modifier实现
function modifier_axe_auto_culling_blade:IsHidden()
    return false
end

function modifier_axe_auto_culling_blade:IsPurgable()
    return false
end

function modifier_axe_auto_culling_blade:GetTexture()
    return "axe_auto_culling_blade"
end

function modifier_axe_auto_culling_blade:OnCreated()
    if not IsServer() then return end

    local ability = self:GetAbility()
    if not ability then
        -- print("[Axe Auto Culling] ERROR: ability is nil in OnCreated")
        return
    end

    -- 从英雄身上读取永久斩杀计数，如果没有则初始化为0
    local caster = self:GetCaster()
    self.check_interval = ability:GetSpecialValueFor("check_interval")
    self.kill_modifier = caster:FindModifierByName("modifier_lion_finger_of_death_kill_counter")
    self.has_autocast = ability:GetAutoCastState()
    --print("[Axe Auto Culling] Modifier创建 - check_interval:", self.check_interval)

    self:StartIntervalThink(self.check_interval)

    -- 立即执行一次检测
    self:OnIntervalThink()
end

function modifier_axe_auto_culling_blade:OnIntervalThink()
    if not IsServer() then return end

    self:CheckAndExecuteCulling()
end

function modifier_axe_auto_culling_blade:CheckAndExecuteCulling()
    local caster = self:GetCaster()
    local ability = self:GetAbility()

    -- 获取淘汰之刃技能
    local culling_blade = caster:FindAbilityByName("axe_culling_blade")
    if not culling_blade then
        --print("[Axe Auto Culling] ERROR: 未找到 axe_culling_blade 技能")
        return
    end

    -- 检查技能是否可以施放
    -- if not culling_blade:IsFullyCastable() then
    --     return
    -- end
    -- if not culling_blade:IsCooldownReady() then
    --     return
    -- end

    -- 获取施法范围

    local culling_range = GetFullCastRange(caster, culling_blade)
    local search_range = culling_range

    -- 查找范围内的敌方英雄
    local enemies = FindUnitsInRadius(
        caster:GetTeam(),
        caster:GetOrigin(),
        nil,
        search_range,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES +
        DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE +
        DOTA_UNIT_TARGET_FLAG_NO_INVIS,
        FIND_ANY_ORDER,
        false
    )

    -- 获取淘汰阈值伤害
    local increase_damage_per_kill = ability:GetSpecialValueFor("armor_per_stack")
    local base_damage = culling_blade:GetSpecialValueFor("damage")
    local armor_damage = 0
    if self.kill_modifier then
        armor_damage = self.kill_modifier:GetStackCount() * increase_damage_per_kill
    end
    local spell_amp = caster:GetSpellAmplification(false)
    local threshold_damage = (base_damage + armor_damage) * (1 + spell_amp)

    -- print("[Axe Auto Culling] 基础伤害:", base_damage, "法术增强:", spell_amp, "实际阈值:", threshold_damage, "armor_damage:",
    --     armor_damage)

    -- 检查每个敌人的血量
    for _, enemy in pairs(enemies) do
        if enemy and not enemy:IsNull() and enemy:IsAlive() then
            local enemy_health = enemy:GetHealth()

            -- 使用安全阈值进行判断
            if enemy_health <= threshold_damage then
                local fx = ParticleManager:CreateParticle(
                    "particles/items3_fx/blink_overwhelming_burst.vpcf",
                    PATTACH_ABSORIGIN_FOLLOW,
                    enemy
                )
                self:AddParticle(fx, false, false, -1, false, false)
                enemy:EmitSound("Hero_Axe.Culling_Blade_Success")
                if self.has_autocast then
                    local targetOrigin = enemy:GetAbsOrigin()
                    local casterOrigin = caster:GetAbsOrigin()

                    -- 计算从目标指向施法者的方向
                    local direction = casterOrigin - targetOrigin
                    direction.z = 0
                    direction = direction:Normalized()

                    -- 设置闪烁距离（攻击距离内）
                    local blinkDistance = 100

                    -- 计算最终位置
                    local blinkPosition = targetOrigin + direction * blinkDistance

                    -- 执行闪烁
                    -- caster:SetAbsOrigin(blinkPosition)
                    FindClearSpaceForUnit(caster, blinkPosition, true)
                end
                enemy:Kill(ability, caster)
                -- 获取kill counter叠加层数

                -- -- ✅ 在释放淘汰之刃前,先施加 100 点纯粹伤害
                -- local damage_table = {
                --     victim = enemy,
                --     attacker = caster,
                --     damage = enemy_health - 100,
                --     damage_type = DAMAGE_TYPE_PURE,
                --     damage_flags = DOTA_DAMAGE_FLAG_REFLECTION,
                --     ability = ability
                -- }
                -- ApplyDamage(damage_table)
                -- -- 添加特效
                -- -- local fx = ParticleManager:CreateParticle(
                -- --     "particles/items3_fx/blink_overwhelming_burst.vpcf",
                -- --     PATTACH_ABSORIGIN_FOLLOW,
                -- --     enemy
                -- -- )
                -- -- self:AddParticle(fx, false, false, -1, false, false)
                -- -- --print("[Axe Auto Culling] 执行斩杀! 目标:", enemy:GetUnitName(), "血量:", enemy_health, "安全阈值:", safe_threshold)
                if enemy:IsAlive() then
                    culling_blade:EndCooldown()
                    -- 设置施法目标并立即施放(绕过施法前摇)
                    caster:SetCursorCastTarget(enemy)
                    caster:CastAbilityImmediately(culling_blade, caster:GetPlayerOwnerID())
                    caster:SetCursorCastTarget(nil)
                end
                -- 监听斩杀成功事件
                Timers:CreateTimer(0.1, function()
                    if not enemy:IsAlive() then
                        if not self.kill_modifier then
                            self.kill_modifier = caster:AddNewModifier(caster, ability,
                                "modifier_axe_culling_blade_permanent",
                                { duration = -1 })
                        end
                        self.kill_modifier:SetStackCount(self.kill_modifier:GetStackCount() + 1)
                    end
                end)
                -- Timers:CreateTimer(0.05, function()
                --     -- 获取基础冷却时间并应用冷却缩减
                --     local base_cooldown = culling_blade:GetCooldown(culling_blade:GetLevel() - 1)
                --     local cooldown_reduction = caster:GetCooldownReduction()
                --     local final_cooldown = base_cooldown * cooldown_reduction
                --     culling_blade:StartCooldown(final_cooldown)
                -- end)
                return
            end
        end
    end
end

function modifier_axe_auto_culling_blade:GetModifierModelScale()
    return 50
end
