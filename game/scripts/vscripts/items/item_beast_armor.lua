LinkLuaModifier("modifier_item_beast_armor_passive", "items/item_beast_armor.lua", LUA_MODIFIER_MOTION_NONE)

-- ========================================
-- DataDriven modifier_item_beast_armor 的 OnCreated 回调
-- ========================================
function BeastArmorOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 添加 Lua 辅助 modifier 处理 ABSORB_SPELL（莲花被动格挡）
    caster:AddNewModifier(caster, ability, "modifier_item_beast_armor_passive", {})
    caster:AddNewModifier(caster, ability, "modifier_item_blade_mail", {})
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
    caster:RemoveModifierByName("modifier_item_blade_mail")
end

-- DataDriven OnSpellStart 全局函数
function OnSpellStart(keys)
    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    local duration = ability:GetSpecialValueFor("active_duration")
    local radius = ability:GetSpecialValueFor("blast_radius")
    local damage = ability:GetSpecialValueFor("blast_damage")

    -- 刃甲效果
    EmitSoundOn("DOTA_Item.BladeMail.Activate", caster)
    caster:AddNewModifier(caster, ability, "modifier_item_blade_mail_reflect", { duration = duration })

    -- 莲花效果
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
    return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_beast_armor_passive:OnCreated()
    if IsServer() then
        if not self:GetAbility() then return end
        local ability = self:GetAbility()

        -- 莲花被动格挡
        self.block_cooldown = ability:GetSpecialValueFor("block_cooldown")
        self.last_block_time = 0
    end
end

function modifier_item_beast_armor_passive:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_ABSORB_SPELL,
    }
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
