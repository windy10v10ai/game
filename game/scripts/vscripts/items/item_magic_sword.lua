-- 链接所有modifier
-- LinkLuaModifier("modifier_item_magic_sword", "items/item_magic_sword", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_magic_sword_active", "items/item_magic_sword", LUA_MODIFIER_MOTION_NONE)
-- LinkLuaModifier("modifier_item_magic_sword_slow", "items/item_magic_sword", LUA_MODIFIER_MOTION_NONE)

-- 物品主类
item_magic_sword = class({})

-- 主动技能效果（datadriven 调用）
function MagicSwordOnSpellStart(keys)
    local caster = keys.caster
    local ability = keys.ability
    local duration = ability:GetSpecialValueFor("active_duration")

    caster:AddNewModifier(caster, ability, "modifier_item_magic_sword_active", { duration = duration })
    EmitSoundOn("Hero_Juggernaut.BladeFury", caster)
end

-- ============================================
-- 被动modifier - 提供属性、溅射和减速
-- ============================================
-- modifier_item_magic_sword = class({})

-- function modifier_item_magic_sword:IsHidden() return true end

-- function modifier_item_magic_sword:IsPurgable() return false end

-- function modifier_item_magic_sword:RemoveOnDeath() return false end

-- function modifier_item_magic_sword:GetAttributes()
--     return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
-- end

-- function modifier_item_magic_sword:OnCreated()
--     self:OnRefresh()
-- end

-- function modifier_item_magic_sword:OnRefresh()
--     self.stats_modifier_name = "modifier_item_magic_sword_stats"

--     if IsServer() then
--         RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
--     end
-- end

-- function modifier_item_magic_sword:OnDestroy()
--     if IsServer() then
--         RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
--     end
-- end

-- function modifier_item_magic_sword:DeclareFunctions()
--     return {}
-- end

-- 溅射效果子函数
function MagicSwordCleaveEffect(params)
    if not IsServer() then return end
    if not params.attacker:IsRealHero() then return end
    if params.attacker:IsRangedAttacker() then return end -- 仅近战有效
    if params.attacker:GetTeam() == params.target:GetTeam() then return end

    local ability = params.ability
    if not ability then return end

    local cleave_distance = ability:GetSpecialValueFor("cleave_distance")
    local cleave_damage_percent = ability:GetSpecialValueFor("cleave_damage_percent")
    local cleave_damage_percent_creep = ability:GetSpecialValueFor("cleave_damage_percent_creep")
    local target_loc = params.target:GetAbsOrigin()

    -- 计算锥形区域内的敌人
    local enemies = FindUnitsInRadius(
        params.attacker:GetTeamNumber(),
        target_loc,
        nil,
        cleave_distance,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC + DOTA_UNIT_TARGET_BUILDING,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,
        FIND_ANY_ORDER,
        false
    )

    -- 计算基础溅射伤害（基于攻击者的攻击力）
    local attacker_damage = params.attacker:GetAverageTrueAttackDamage(params.target)

    for _, enemy in pairs(enemies) do
        if enemy ~= params.target then
            local damage_percent = enemy:IsCreep() and cleave_damage_percent_creep or cleave_damage_percent

            local cleave_damage = attacker_damage * damage_percent / 100


            ApplyDamage({
                victim = enemy,
                attacker = params.attacker,
                damage = cleave_damage,
                damage_type = DAMAGE_TYPE_PHYSICAL,
                damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
                ability = ability,
            })
        end
    end
end

-- 减速效果子函数
function MagicSwordSlowEffect(params)
    if not IsServer() then return end
    if params.attacker:GetTeam() == params.target:GetTeam() then return end

    local ability = params.ability
    if not ability then return end

    local slow_duration = ability:GetSpecialValueFor("slow_duration")

    -- 施加减速debuff
    params.target:AddNewModifier(
        params.attacker,
        ability,
        "modifier_item_magic_sword_slow",
        { duration = slow_duration }
    )
end

-- 攻击命中效果（datadriven 调用）
function MagicSwordOnAttackLanded(params)
    -- 调用溅射效果
    MagicSwordCleaveEffect(params)

    -- 调用减速效果
    -- MagicSwordSlowEffect(params)
end

-- ============================================
-- 主动效果modifier - 物理伤害转纯粹伤害
-- ============================================
modifier_item_magic_sword_active = class({})

function modifier_item_magic_sword_active:IsHidden() return false end

function modifier_item_magic_sword_active:IsPurgable() return false end

function modifier_item_magic_sword_active:IsDebuff() return false end

function modifier_item_magic_sword_active:OnCreated()
    self.convert_pct = self:GetAbility():GetSpecialValueFor("convert_pct")

    if not IsServer() then return end

    local parent = self:GetParent()

    -- 添加特效
    local fx = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_juggernaut/juggernaut_blade_fury.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        parent
    )
    self:AddParticle(fx, false, false, -1, false, false)
end

function modifier_item_magic_sword_active:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_TAKEDAMAGE,
        MODIFIER_PROPERTY_TOOLTIP,
    }
end

function modifier_item_magic_sword_active:OnTooltip()
    return self.convert_pct
end

function modifier_item_magic_sword_active:OnTakeDamage(params)
    if not IsServer() then return end

    if params.attacker ~= self:GetParent() then return end
    if params.damage_type ~= DAMAGE_TYPE_PHYSICAL then return end

    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) == DOTA_DAMAGE_FLAG_REFLECTION then
        return
    end

    local ability = self:GetAbility()
    if not ability then return end

    local pure_damage = params.damage * self.convert_pct / 100

    -- 造成纯粹伤害
    ApplyDamage({
        victim = params.unit,
        attacker = self:GetParent(),
        damage = pure_damage,
        damage_type = DAMAGE_TYPE_PURE,
        ability = ability,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    })
end

function modifier_item_magic_sword_active:GetTexture()
    return "item_magic_sword"
end

-- ============================================
-- 减速debuff modifier
-- ============================================
-- modifier_item_magic_sword_slow = class({})

-- function modifier_item_magic_sword_slow:IsHidden() return false end

-- function modifier_item_magic_sword_slow:IsDebuff() return true end

-- function modifier_item_magic_sword_slow:IsPurgable() return true end

-- function modifier_item_magic_sword_slow:OnCreated()
--     if not self:GetAbility() then return end
--     self.slow_pct = self:GetAbility():GetSpecialValueFor("slow_pct") or -30
-- end

-- function modifier_item_magic_sword_slow:DeclareFunctions()
--     return {
--         MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
--     }
-- end

-- function modifier_item_magic_sword_slow:GetModifierMoveSpeedBonus_Percentage()
--     return self.slow_pct or -30
-- end

-- function modifier_item_magic_sword_slow:GetTexture()
--     return "item_magic_sword"
-- end
