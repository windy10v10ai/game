-- game/scripts/vscripts/items/item_beast_armor.lua
if item_beast_armor == nil then item_beast_armor = class({}) end

LinkLuaModifier("modifier_item_beast_armor_active", "items/item_beast_armor.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_beast_armor_passive", "items/item_beast_armor.lua", LUA_MODIFIER_MOTION_NONE)

function item_beast_armor:GetIntrinsicModifierName()
    return "modifier_item_beast_armor"
end

-- ========================================
-- DataDriven modifier_item_beast_armor 的 OnCreated 回调
-- ========================================
function BeastArmorOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 添加 Lua 辅助 modifier 处理 ABSORB_SPELL（莲花被动格挡）和被动反伤
    caster:AddNewModifier(caster, ability, "modifier_item_beast_armor_passive", {})
end

-- ========================================
-- DataDriven modifier_item_beast_armor 的 OnDestroy 回调
-- ========================================
function BeastArmorOnDestroy(keys)
    if not IsServer() then return end

    local caster = keys.caster

    if not caster then return end

    -- 移除 Lua 辅助 modifier
    caster:RemoveModifierByName("modifier_item_beast_armor_passive")
end

-- DataDriven OnSpellStart 全局函数
function OnSpellStart(keys)
    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    local duration = ability:GetSpecialValueFor("active_duration")
    local radius = ability:GetSpecialValueFor("blast_radius")
    local damage = ability:GetSpecialValueFor("blast_damage")

    -- 刃甲激活音效
    EmitSoundOn("DOTA_Item.BladeMail.Activate", caster)

    -- 先给自己添加反弹效果，再对敌人造成伤害
    caster:AddNewModifier(caster, ability, "modifier_item_beast_armor_active", { duration = duration })
    caster:AddNewModifier(caster, ability, "modifier_item_lotus_orb_active", { duration = duration })

    -- 冰甲冲击波效果
    local particle = ParticleManager:CreateParticle("particles/items2_fx/shivas_guard_active.vpcf",
        PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:SetParticleControl(particle, 0, caster:GetAbsOrigin())
    ParticleManager:SetParticleControl(particle, 1, Vector(radius, radius, radius))
    ParticleManager:ReleaseParticleIndex(particle)

    EmitSoundOn("DOTA_Item.ShivasGuard.Activate", caster)

    -- 对范围内敌人造成伤害和debuff
    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(),
        caster:GetAbsOrigin(),
        nil,
        radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_NONE,
        FIND_ANY_ORDER,
        false
    )

    for _, enemy in pairs(enemies) do
        ApplyDamage({
            victim = enemy,
            attacker = caster,
            damage = damage,
            damage_type = DAMAGE_TYPE_MAGICAL,
            ability = ability
        })

        -- 只给敌人添加减速debuff
        ability:ApplyDataDrivenModifier(caster, enemy, "modifier_item_beast_armor_debuff", {
            duration = duration * (1 - enemy:GetStatusResistance())
        })
        -- 添加特效
        local particle = ParticleManager:CreateParticle("particles/items2_fx/shivas_guard_impact.vpcf",
            PATTACH_ABSORIGIN_FOLLOW, enemy)
        ParticleManager:ReleaseParticleIndex(particle)
    end
end

-- ========================================
-- 辉耀灼烧伤害函数（DataDriven OnIntervalThink 调用）
-- ========================================
function RadianceBurnDamage(keys)
    if not IsServer() then return end

    local target = keys.target
    local caster = keys.caster
    local ability = keys.ability

    if not ability then return end

    local aura_damage = ability:GetSpecialValueFor("aura_damage")

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = aura_damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = ability
    })
end

-- ========================================
-- Lua 辅助 modifier（处理 ABSORB_SPELL 和被动反伤）
-- ========================================
modifier_item_beast_armor_passive = class({})

function modifier_item_beast_armor_passive:IsHidden() return true end

function modifier_item_beast_armor_passive:IsPurgable() return false end

function modifier_item_beast_armor_passive:RemoveOnDeath() return true end

function modifier_item_beast_armor_passive:GetAttributes()
    return MODIFIER_ATTRIBUTE_MULTIPLE
end

function modifier_item_beast_armor_passive:OnCreated()
    if IsServer() then
        if not self:GetAbility() then return end
        local ability = self:GetAbility()

        -- 莲花被动格挡
        self.block_cooldown = ability:GetSpecialValueFor("block_cooldown")
        self.last_block_time = 0

        -- 属性
        self.active_reflection_pct = ability:GetSpecialValueFor("active_reflection_pct") / 100
        self.passive_reflection_constant = ability:GetSpecialValueFor("passive_reflection_constant")
        self.passive_reflection_pct = ability:GetSpecialValueFor("passive_reflection_pct") / 100
        print("active_reflection_pct", self.active_reflection_pct)
        print("passive_reflection_constant", self.passive_reflection_constant)
        print("passive_reflection_pct", self.passive_reflection_pct)
    end
end

function modifier_item_beast_armor_passive:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_ABSORB_SPELL,
        MODIFIER_EVENT_ON_TAKEDAMAGE,
    }
end

-- 被动反伤
function modifier_item_beast_armor_passive:OnTakeDamage(params)
    if not IsServer() then return end
    if params.unit ~= self:GetParent() then return end
    if params.attacker == self:GetParent() then return end
    if not params.attacker:IsAlive() then return end

    -- 检查是否来自其他刃甲反伤（避免无限循环）
    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) == DOTA_DAMAGE_FLAG_REFLECTION then
        return
    end

    local reflect_damage
    -- 检测是否有主动 modifier，使用对应的反伤数值
    if self:GetParent():HasModifier("modifier_item_beast_armor_active") then
        -- 主动反伤：100% 原始伤害
        reflect_damage = params.original_damage * self.active_reflection_pct
    else
        -- 被动反伤：固定值 + 百分比
        reflect_damage = self.passive_reflection_constant + (params.original_damage * self.passive_reflection_pct)
    end

    ApplyDamage({
        victim = params.attacker,
        attacker = self:GetParent(),
        damage = reflect_damage,
        damage_type = params.damage_type,
        ability = self:GetAbility(),
        damage_flags = DOTA_DAMAGE_FLAG_REFLECTION + DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    })
end

-- 莲花被动格挡
function modifier_item_beast_armor_passive:GetAbsorbSpell(params)
    if not IsServer() then return 0 end

    local caster = params.ability:GetCaster()
    if not IsEnemy(caster, self:GetParent()) then return 0 end

    local current_time = GameRules:GetGameTime()
    if current_time - self.last_block_time < self.block_cooldown then
        return 0
    end

    self.last_block_time = current_time

    -- 特效
    local particle = ParticleManager:CreateParticle("particles/items_fx/immunity_sphere.vpcf", PATTACH_ABSORIGIN_FOLLOW,
        self:GetParent())
    ParticleManager:ReleaseParticleIndex(particle)

    EmitSoundOn("DOTA_Item.LinkensSphere.Activate", self:GetParent())

    return 1
end

-- ========================================
-- 主动反弹modifier（100%反伤）
-- ========================================
modifier_item_beast_armor_active = class({})

function modifier_item_beast_armor_active:IsHidden() return false end

function modifier_item_beast_armor_active:IsPurgable() return false end

-- 主动反弹modifier（100%反伤）- 续
function modifier_item_beast_armor_active:OnCreated()
    if not IsServer() then return end
    self.reflection_pct = self:GetAbility():GetSpecialValueFor("active_reflection_pct")

    -- 添加持续特效（护盾特效）
    local parent = self:GetParent()

    -- 【修复】使用 AddParticle 添加持续特效
    local fx = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_templar_assassin/templar_assassin_refraction.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        parent
    )
    ParticleManager:SetParticleControlEnt(fx, 0, parent, PATTACH_ABSORIGIN_FOLLOW, "attach_hitloc", parent:GetAbsOrigin(),
        true)
    ParticleManager:SetParticleControlEnt(fx, 1, parent, PATTACH_ABSORIGIN_FOLLOW, "attach_hitloc", parent:GetAbsOrigin(),
        true)
    self:AddParticle(fx, false, false, -1, false, false)

    -- 【新增】添加刃甲激活特效（持续显示）
    local blademail_fx = ParticleManager:CreateParticle(
        "particles/items_fx/blademail.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        parent
    )
    ParticleManager:SetParticleControl(blademail_fx, 0, parent:GetAbsOrigin())
    self:AddParticle(blademail_fx, false, false, -1, false, false)

    -- 刃甲持续音效
    EmitSoundOn("DOTA_Item.BladeMail.Damage", self:GetParent())
end

function modifier_item_beast_armor_active:OnDestroy()
    if not IsServer() then return end
    StopSoundOn("DOTA_Item.BladeMail.Damage", self:GetParent())
end

function modifier_item_beast_armor_active:GetTexture()
    return "item_beast_armor"
end

function modifier_item_beast_armor_active:GetEffectName()
    return "particles/items_fx/immunity_sphere.vpcf"
end

function modifier_item_beast_armor_active:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end
