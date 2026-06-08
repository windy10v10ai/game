LinkLuaModifier("modifier_axe_auto_culling_blade", "abilities/axe_auto_culling_blade", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_axe_auto_culling_blade_passive", "abilities/axe_auto_culling_blade", LUA_MODIFIER_MOTION_NONE)

axe_auto_culling_blade = axe_auto_culling_blade or class({})
modifier_axe_auto_culling_blade = modifier_axe_auto_culling_blade or class({})
modifier_axe_auto_culling_blade_passive = modifier_axe_auto_culling_blade_passive or class({})

function axe_auto_culling_blade:GetIntrinsicModifierName()
    return "modifier_axe_auto_culling_blade_passive"
end

-- 常驻被动：开启自动施法且不在CD时，检测到周围有可斩英雄即自动开启（走原主动逻辑）
modifier_axe_auto_culling_blade_passive = class({})

function modifier_axe_auto_culling_blade_passive:IsHidden() return true end

function modifier_axe_auto_culling_blade_passive:IsPurgable() return false end

function modifier_axe_auto_culling_blade_passive:RemoveOnDeath() return false end

function modifier_axe_auto_culling_blade_passive:OnCreated()
    if not IsServer() then return end
    self:StartIntervalThink(0.3)
end

function modifier_axe_auto_culling_blade_passive:OnIntervalThink()
    if not IsServer() then return end
    local ability = self:GetAbility()
    local caster = self:GetCaster()
    if not ability:GetAutoCastState() then return end
    if not ability:IsCooldownReady() then return end
    if caster:HasModifier("modifier_axe_auto_culling_blade") then return end
    if not ability:FindCullableEnemy() then return end

    caster:SetCursorPosition(caster:GetAbsOrigin())
    caster:CastAbilityImmediately(ability, caster:GetPlayerOwnerID())
end

-- 查找范围内第一个血量低于斩杀阈值的敌方英雄，无则返回 nil（自动触发判定与窗口斩杀共用）
function axe_auto_culling_blade:FindCullableEnemy()
    local caster = self:GetCaster()
    local culling_blade = caster:FindAbilityByName("axe_culling_blade")
    if not culling_blade then return nil end

    local enemies = FindUnitsInRadius(
        caster:GetTeam(),
        caster:GetOrigin(),
        nil,
        GetFullCastRange(caster, culling_blade),
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES +
        DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE +
        DOTA_UNIT_TARGET_FLAG_NO_INVIS,
        FIND_ANY_ORDER,
        false
    )
    if #enemies == 0 then return nil end

    local kill_modifier = caster:FindModifierByName("modifier_axe_culling_blade_permanent")
    local armor_damage = kill_modifier
        and kill_modifier:GetStackCount() * self:GetSpecialValueFor("armor_per_stack")
        or 0
    local base_damage = culling_blade:GetSpecialValueFor("damage")
    local threshold_damage = (base_damage + armor_damage) * (1 + caster:GetSpellAmplification(false))

    for _, enemy in pairs(enemies) do
        if enemy and not enemy:IsNull() and enemy:IsAlive() and enemy:GetHealth() <= threshold_damage then
            return enemy
        end
    end
    return nil
end

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
    self.kill_modifier = caster:FindModifierByName("modifier_axe_culling_blade_permanent")
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

    local enemy = ability:FindCullableEnemy()
    if not enemy then return end

    local culling_blade = caster:FindAbilityByName("axe_culling_blade")

    local fx = ParticleManager:CreateParticle(
        "particles/items3_fx/blink_overwhelming_burst.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        enemy
    )
    self:AddParticle(fx, false, false, -1, false, false)
    enemy:EmitSound("Hero_Axe.Culling_Blade_Success")

    if self.has_autocast then
        -- 闪到目标身侧再斩
        local targetOrigin = enemy:GetAbsOrigin()
        local direction = (caster:GetAbsOrigin() - targetOrigin)
        direction.z = 0
        direction = direction:Normalized()
        FindClearSpaceForUnit(caster, targetOrigin + direction * 100, true)
    end

    enemy:Kill(ability, caster)

    if enemy:IsAlive() then
        culling_blade:EndCooldown()
        -- 立即施放绕过前摇
        caster:SetCursorCastTarget(enemy)
        caster:CastAbilityImmediately(culling_blade, caster:GetPlayerOwnerID())
        caster:SetCursorCastTarget(nil)
    end

    Timers:CreateTimer(0.1, function()
        if not enemy:IsAlive() then
            if not self.kill_modifier then
                self.kill_modifier = caster:AddNewModifier(caster, ability,
                    "modifier_axe_culling_blade_permanent", { duration = -1 })
            end
            self.kill_modifier:SetStackCount(self.kill_modifier:GetStackCount() + 1)
        end
    end)
end

function modifier_axe_auto_culling_blade:GetModifierModelScale()
    return 50
end
