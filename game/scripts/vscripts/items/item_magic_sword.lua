-- 链接所有modifier
LinkLuaModifier("modifier_item_magic_sword", "items/item_magic_sword", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_magic_sword_active", "items/item_magic_sword", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_magic_sword_slow", "items/item_magic_sword", LUA_MODIFIER_MOTION_NONE)

-- 物品主类
item_magic_sword = class({})

function item_magic_sword:GetIntrinsicModifierName()
    return "modifier_item_magic_sword"
end

function item_magic_sword:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("active_duration")

    caster:AddNewModifier(caster, self, "modifier_item_magic_sword_active", { duration = duration })
    EmitSoundOn("Hero_Juggernaut.BladeFury", caster)
end

-- ============================================
-- 被动modifier - 提供属性、溅射和减速
-- ============================================
modifier_item_magic_sword = class({})

function modifier_item_magic_sword:IsHidden() return true end

function modifier_item_magic_sword:IsPurgable() return false end

function modifier_item_magic_sword:RemoveOnDeath() return false end

function modifier_item_magic_sword:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_magic_sword:OnCreated()
    self:OnRefresh()

    if not self:GetAbility() then return end
    local ability = self:GetAbility()

    -- 溅射参数（事件驱动，必须在 Lua 中实现）
    self.cleave_distance = ability:GetSpecialValueFor("cleave_distance")
    self.cleave_damage_percent = ability:GetSpecialValueFor("cleave_damage_percent")
    self.cleave_damage_percent_creep = ability:GetSpecialValueFor("cleave_damage_percent_creep")

    -- 减速参数（事件驱动，必须在 Lua 中实现）
    self.slow_duration = ability:GetSpecialValueFor("slow_duration")
end

function modifier_item_magic_sword:OnRefresh()
    self.stats_modifier_name = "modifier_item_magic_sword_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_magic_sword:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_magic_sword:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_PROCATTACK_FEEDBACK,
        MODIFIER_EVENT_ON_ATTACK_LANDED,
    }
end

-- 溅射效果
function modifier_item_magic_sword:GetModifierProcAttack_Feedback(keys)
    if not IsServer() then return end
    if not keys.attacker:IsRealHero() then return end
    if keys.attacker:IsRangedAttacker() then return end -- 仅近战有效
    if keys.attacker:GetTeam() == keys.target:GetTeam() then return end

    local ability = self:GetAbility()
    if not ability then return end

    local target_loc = keys.target:GetAbsOrigin()

    -- 计算锥形区域内的敌人
    local enemies = FindUnitsInRadius(
        keys.attacker:GetTeamNumber(),
        target_loc,
        nil,
        self.cleave_distance,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC + DOTA_UNIT_TARGET_BUILDING,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,
        FIND_ANY_ORDER,
        false
    )

    for _, enemy in pairs(enemies) do
        if enemy ~= keys.target then
            local damage_percent = enemy:IsCreep() and self.cleave_damage_percent_creep or self.cleave_damage_percent
            local damage = keys.damage * damage_percent / 100

            ApplyDamage({
                victim = enemy,
                attacker = keys.attacker,
                damage = damage,
                damage_type = DAMAGE_TYPE_PHYSICAL,
                damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
                ability = ability,
            })
        end
    end
end

-- 减速效果触发
function modifier_item_magic_sword:OnAttackLanded(params)
    if not IsServer() then return end
    if params.attacker ~= self:GetParent() then return end
    if params.attacker:GetTeam() == params.target:GetTeam() then return end

    -- 施加减速debuff
    params.target:AddNewModifier(
        self:GetParent(),
        self:GetAbility(),
        "modifier_item_magic_sword_slow",
        { duration = self.slow_duration }
    )
end

-- ============================================
-- 主动效果modifier - 物理伤害转纯粹伤害
-- ============================================
modifier_item_magic_sword_active = class({})

function modifier_item_magic_sword_active:IsHidden() return false end

function modifier_item_magic_sword_active:IsPurgable() return false end

function modifier_item_magic_sword_active:IsDebuff() return false end

function modifier_item_magic_sword_active:OnCreated()
    local ability = self:GetAbility()
    if ability then
        self.convert_pct = ability:GetSpecialValueFor("convert_pct") or 10
    else
        self.convert_pct = 10
    end

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
modifier_item_magic_sword_slow = class({})

function modifier_item_magic_sword_slow:IsHidden() return false end

function modifier_item_magic_sword_slow:IsDebuff() return true end

function modifier_item_magic_sword_slow:IsPurgable() return true end

function modifier_item_magic_sword_slow:OnCreated()
    if not self:GetAbility() then return end
    self.slow_pct = self:GetAbility():GetSpecialValueFor("slow_pct") or -30
end

function modifier_item_magic_sword_slow:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
    }
end

function modifier_item_magic_sword_slow:GetModifierMoveSpeedBonus_Percentage()
    return self.slow_pct or -30
end

function modifier_item_magic_sword_slow:GetTexture()
    return "item_magic_sword"
end
