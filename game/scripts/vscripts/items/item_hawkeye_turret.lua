-- ========================================
-- 鹰眼炮台 - Hawkeye Turret
-- ========================================

-- LinkLuaModifier for Lua-based modifiers
LinkLuaModifier("modifier_item_hawkeye_turret_splash", "items/item_hawkeye_turret.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_hawkeye_turret_splash_cooldown", "items/item_hawkeye_turret.lua", LUA_MODIFIER_MOTION_NONE)

-- ========================================
-- 主动技能
-- ========================================
function OnSpellStart(keys)
    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 近战英雄使用无效
    if not caster:IsRangedAttacker() then
        return
    end

    local duration = ability:GetSpecialValueFor("active_duration")

    -- 应用主动 buff (使用 DataDriven modifier)
    ability:ApplyDataDrivenModifier(caster, caster, "modifier_item_hawkeye_turret_active", {
        duration = duration
    })

    -- 播放音效
    EmitSoundOn("DOTA_Item.HurricanePike.Activate", caster)
end

-- ========================================
-- DataDriven modifier_item_hawkeye_turret 的 OnCreated 回调
-- ========================================
function HawkeyeTurretOnCreated(keys)
    print("HawkeyeTurretOnCreated")
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 添加 Desolator modifier (原生 modifier)
    local desolator_modifier = caster:AddNewModifier(caster, ability, "modifier_item_desolator", {})

    -- 添加溅射伤害 Lua modifier (检查是否已存在，避免叠加)
    local splash_modifier = nil
    if not caster:HasModifier("modifier_item_hawkeye_turret_splash") then
        splash_modifier = caster:AddNewModifier(caster, ability, "modifier_item_hawkeye_turret_splash", {})
    end

    -- 保存 modifier 引用到 ability，以便 OnDestroy 时精确移除
    if not ability.added_modifiers then
        ability.added_modifiers = {}
    end

    if desolator_modifier then
        table.insert(ability.added_modifiers, desolator_modifier)
    end
    if splash_modifier then
        table.insert(ability.added_modifiers, splash_modifier)
    end
end

-- ========================================
-- DataDriven modifier_item_hawkeye_turret 的 OnDestroy 回调
-- ========================================
function HawkeyeTurretOnDestroy(keys)
    if not IsServer() then return end

    local ability = keys.ability

    if not ability or not ability.added_modifiers then return end

    -- 只移除此物品实例添加的 modifier
    for _, modifier in pairs(ability.added_modifiers) do
        if modifier and not modifier:IsNull() then
            modifier:Destroy()
        end
    end

    -- 清空记录，防止内存泄漏
    ability.added_modifiers = nil
end

-- ========================================
-- DataDriven modifier_item_hawkeye_turret_active 的 OnCreated 回调
-- 使用 AddFOWViewer 添加高空视野
-- ========================================
function HawkeyeTurretActiveOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 获取视野参数
    local vision_radius = caster:Script_GetAttackRange() + ability:GetSpecialValueFor("active_bonus_vision")
    local duration = ability:GetSpecialValueFor("active_duration")

    -- 初始化 FOW viewers 表
    if not caster.fow_viewers then
        caster.fow_viewers = {}
    end

    -- 在单位位置添加高空视野（false = 高空视野，无视地形阻挡）
    local fow_viewer = AddFOWViewer(
        caster:GetTeamNumber(), -- 队伍
        caster:GetAbsOrigin(),  -- 位置
        vision_radius,          -- 视野半径
        duration,               -- 持续时间
        false                   -- false = 高空视野（flying vision），无视地形阻挡
    )
    table.insert(caster.fow_viewers, fow_viewer)
end

-- ========================================
-- DataDriven modifier_item_hawkeye_turret_active 的 OnDestroy 回调
-- 移除 AddFOWViewer 添加的视野
-- ========================================
function HawkeyeTurretActiveOnDestroy(keys)
    if not IsServer() then return end

    local caster = keys.caster

    if not caster then return end

    -- 移除所有 FOW viewers
    if caster.fow_viewers then
        local team_number = caster:GetTeamNumber()
        for _, viewer in pairs(caster.fow_viewers) do
            RemoveFOWViewer(team_number, viewer)
        end
        caster.fow_viewers = nil
    end
end

-- ========================================
-- Lua 辅助 modifier - 溅射伤害
-- ========================================
modifier_item_hawkeye_turret_splash = class({})

function modifier_item_hawkeye_turret_splash:IsHidden()
    return true
end

function modifier_item_hawkeye_turret_splash:IsPurgable()
    return false
end

function modifier_item_hawkeye_turret_splash:RemoveOnDeath()
    return false
end

function modifier_item_hawkeye_turret_splash:GetAttributes()
    return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_hawkeye_turret_splash:OnCreated()
    if not IsServer() then return end

    local ability = self:GetAbility()
    self.attack_radius = ability:GetSpecialValueFor("attack_radius")
    self.attack_percent = ability:GetSpecialValueFor("attack_percent")
    self.internal_cooldown = ability:GetSpecialValueFor("internal_cooldown")
end

function modifier_item_hawkeye_turret_splash:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_PROCATTACK_FEEDBACK
    }
end

-- 攻击反馈时触发溅射
function modifier_item_hawkeye_turret_splash:GetModifierProcAttack_Feedback(params)
    if not IsServer() then return end

    local attacker = params.attacker
    local target = params.target

    -- 基础检查
    if not attacker:IsRealHero() then return end
    if not attacker:IsRangedAttacker() then return end
    if attacker:GetTeam() == target:GetTeam() then return end
    if target:IsBuilding() then return end

    -- 检查冷却时间
    if attacker:HasModifier("modifier_item_hawkeye_turret_splash_cooldown") then return end

    local ability = self:GetAbility()
    if not ability then return end

    local target_loc = target:GetAbsOrigin()

    -- 使用 CalculateActualDamage 计算考虑护甲减免的实际伤害
    local actual_damage = CalculateActualDamage(params.damage, target)
    local damage = actual_damage * self.attack_percent / 100

    -- 播放粒子特效
    local blast_pfx = ParticleManager:CreateParticle("particles/custom/shrapnel.vpcf", PATTACH_CUSTOMORIGIN, nil)
    ParticleManager:SetParticleControl(blast_pfx, 0, target_loc)
    ParticleManager:ReleaseParticleIndex(blast_pfx)

    -- 查找范围内的敌人
    local enemies = FindUnitsInRadius(
        attacker:GetTeamNumber(),
        target_loc,
        nil,
        self.attack_radius,
        ability:GetAbilityTargetTeam(),
        ability:GetAbilityTargetType(),
        DOTA_UNIT_TARGET_FLAG_NONE,
        FIND_ANY_ORDER,
        false
    )

    -- 对范围内的敌人造成溅射伤害
    for _, enemy in pairs(enemies) do
        if enemy ~= target then
            ApplyDamage({
                victim = enemy,
                attacker = attacker,
                damage = damage,
                damage_type = ability:GetAbilityDamageType(),
                damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION + DOTA_DAMAGE_FLAG_REFLECTION,
                ability = ability
            })
        end
    end

    -- 应用冷却时间
    attacker:AddNewModifier(attacker, ability, "modifier_item_hawkeye_turret_splash_cooldown", {
        duration = self.internal_cooldown
    })
end

-- ========================================
-- 溅射冷却 modifier
-- ========================================
modifier_item_hawkeye_turret_splash_cooldown = class({})

function modifier_item_hawkeye_turret_splash_cooldown:IsHidden()
    return true
end

function modifier_item_hawkeye_turret_splash_cooldown:IsPurgable()
    return false
end

function modifier_item_hawkeye_turret_splash_cooldown:RemoveOnDeath()
    return true
end
