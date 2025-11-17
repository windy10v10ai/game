-- ========================================
-- 鹰眼炮台 - Hawkeye Turret
-- ========================================

-- LinkLuaModifier for Lua-based modifiers
LinkLuaModifier("modifier_item_hawkeye_turret_splash", "items/item_hawkeye_turret.lua", LUA_MODIFIER_MOTION_NONE)

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

    -- 添加溅射伤害 Lua modifier
    local splash_modifier = caster:AddNewModifier(caster, ability, "modifier_item_hawkeye_turret_splash", {})

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

-- TODO 优化，参考幽鬼折射 或者使用行家阵列
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
    if IsServer() then
        self.last_trigger_time = 0
    end
end

function modifier_item_hawkeye_turret_splash:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ATTACK_LANDED
    }
end

-- 攻击命中时触发溅射
function modifier_item_hawkeye_turret_splash:OnAttackLanded(params)
    if not IsServer() then return end

    local attacker = params.attacker
    local target = params.target
    local ability = self:GetAbility()

    if not ability then return end

    -- 只对持有者的攻击生效
    if attacker ~= self:GetParent() then return end

    -- 读取参数
    local radius = ability:GetSpecialValueFor("attack_radius")
    local damage_percent = ability:GetSpecialValueFor("attack_percent") / 100
    local cooldown = ability:GetSpecialValueFor("internal_cooldown")

    -- 检查内部冷却时间
    local current_time = GameRules:GetGameTime()
    if current_time - self.last_trigger_time < cooldown then
        return
    end

    self.last_trigger_time = current_time

    -- 获取攻击伤害
    local damage = params.damage

    -- 查找范围内的敌人
    local enemies = FindUnitsInRadius(
        attacker:GetTeamNumber(),
        target:GetAbsOrigin(),
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_NONE,
        FIND_ANY_ORDER,
        false
    )

    -- 对范围内的敌人造成溅射伤害
    for _, enemy in pairs(enemies) do
        -- 跳过主目标（已经受到原始伤害）
        if enemy ~= target then
            -- 造成溅射伤害
            ApplyDamage({
                victim = enemy,
                attacker = attacker,
                damage = damage * damage_percent,
                damage_type = DAMAGE_TYPE_PHYSICAL,
                damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
                ability = ability
            })
        end
    end
end
