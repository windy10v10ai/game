-- game/scripts/vscripts/items/item_beast_armor.lua
if item_beast_armor == nil then item_beast_armor = class({}) end

LinkLuaModifier("modifier_item_beast_armor", "items/item_beast_armor.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_beast_armor_active", "items/item_beast_armor.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_beast_armor_debuff", "items/item_beast_armor.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_beast_armor_radiance", "items/item_beast_armor.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_beast_armor_radiance_debuff", "items/item_beast_armor.lua", LUA_MODIFIER_MOTION_NONE)

function item_beast_armor:GetIntrinsicModifierName()
    return "modifier_item_beast_armor"
end

function item_beast_armor:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("active_duration")
    local radius = self:GetSpecialValueFor("blast_radius")
    local damage = self:GetSpecialValueFor("blast_damage")

    -- 刃甲激活音效
    EmitSoundOn("DOTA_Item.BladeMail.Activate", caster)

    -- 冰甲冲击波效果
    local particle = ParticleManager:CreateParticle("particles/items2_fx/shivas_guard_active.vpcf",
        PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:SetParticleControl(particle, 0, caster:GetAbsOrigin())
    ParticleManager:SetParticleControl(particle, 1, Vector(radius, radius, radius))
    ParticleManager:ReleaseParticleIndex(particle)

    EmitSoundOn("DOTA_Item.ShivasGuard.Activate", caster)

    -- 【重要】先给自己添加反弹效果，再对敌人造成伤害
    caster:AddNewModifier(caster, self, "modifier_item_beast_armor_active", { duration = duration })
    caster:AddNewModifier(caster, self, "modifier_item_lotus_orb_active", { duration = duration })

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
            ability = self
        })

        -- 只给敌人添加减速debuff
        enemy:AddNewModifier(caster, self, "modifier_item_beast_armor_debuff", {
            duration = duration * (1 - enemy:GetStatusResistance())
        })
        -- 添加特效 particles/items2_fx/shivas_guard_impact.vpcf
        local particle = ParticleManager:CreateParticle("particles/items2_fx/shivas_guard_impact.vpcf",
            PATTACH_ABSORIGIN_FOLLOW, enemy)
        ParticleManager:ReleaseParticleIndex(particle)
    end
end

-- ========================================
-- 被动modifier（包含被动25%反伤）
-- ========================================
modifier_item_beast_armor = class({})

function modifier_item_beast_armor:IsHidden() return true end

function modifier_item_beast_armor:IsPurgable() return false end

function modifier_item_beast_armor:RemoveOnDeath() return false end

function modifier_item_beast_armor:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_beast_armor:OnCreated()
    self:OnRefresh()

    if IsServer() then
        if not self:GetAbility() then return end
        local ability = self:GetAbility()

        -- 莲花被动格挡
        self.block_cooldown = ability:GetSpecialValueFor("block_cooldown")
        self.last_block_time = 0

        -- 自动开启辉耀光环
        self:GetParent():AddNewModifier(self:GetParent(), ability, "modifier_item_beast_armor_radiance", {})
    end
end

function modifier_item_beast_armor:OnRefresh()
    self.stats_modifier_name = "modifier_item_beast_armor_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_beast_armor:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
        -- 移除辉耀光环
        self:GetParent():RemoveModifierByName("modifier_item_beast_armor_radiance")
    end
end

function modifier_item_beast_armor:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_ABSORB_SPELL,
        MODIFIER_EVENT_ON_TAKEDAMAGE,
    }
end

-- 被动25%反伤
function modifier_item_beast_armor:OnTakeDamage(params)
    if not IsServer() then return end
    if params.unit ~= self:GetParent() then return end
    if params.attacker == self:GetParent() then return end
    if not params.attacker:IsAlive() then return end

    -- 检查是否来自其他刃甲反伤（避免无限循环）
    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) == DOTA_DAMAGE_FLAG_REFLECTION then
        return
    end

    local ability = self:GetAbility()
    if not ability or ability:GetSecondaryCharges() ~= 1 then return end

    -- 计算被动反伤：固定值 + 25%
    local constant_reflect = ability:GetSpecialValueFor("passive_reflection_constant")
    local pct_reflect = ability:GetSpecialValueFor("passive_reflection_pct") / 100
    local reflect_damage = constant_reflect + (params.original_damage * pct_reflect)

    -- 反弹伤害
    ApplyDamage({
        victim = params.attacker,
        attacker = self:GetParent(),
        damage = reflect_damage,
        damage_type = params.damage_type,
        ability = ability,
        damage_flags = DOTA_DAMAGE_FLAG_REFLECTION + DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    })
end

-- 莲花被动格挡
function modifier_item_beast_armor:GetAbsorbSpell(params)
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
-- 辉耀灼烧光环 modifier
-- ========================================
modifier_item_beast_armor_radiance = class({})

function modifier_item_beast_armor_radiance:IsHidden() return false end

function modifier_item_beast_armor_radiance:IsPurgable() return false end

function modifier_item_beast_armor_radiance:IsAura() return true end

function modifier_item_beast_armor_radiance:GetAuraRadius()
    return self:GetAbility():GetSpecialValueFor("aura_radius")
end

function modifier_item_beast_armor_radiance:GetAuraSearchTeam()
    return DOTA_UNIT_TARGET_TEAM_ENEMY
end

function modifier_item_beast_armor_radiance:GetAuraSearchType()
    return DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC
end

function modifier_item_beast_armor_radiance:GetModifierAura()
    return "modifier_item_beast_armor_radiance_debuff"
end

function modifier_item_beast_armor_radiance:GetAuraSearchFlags()
    return DOTA_UNIT_TARGET_FLAG_NONE
end

function modifier_item_beast_armor_radiance:GetEffectName()
    return "particles/items2_fx/radiance_owner.vpcf"
end

function modifier_item_beast_armor_radiance:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end

function modifier_item_beast_armor_radiance:GetTexture()
    return "item_radiance"
end

-- 补充完整的辉耀灼烧debuff modifier
modifier_item_beast_armor_radiance_debuff = class({})

function modifier_item_beast_armor_radiance_debuff:IsHidden() return false end

function modifier_item_beast_armor_radiance_debuff:IsDebuff() return true end

function modifier_item_beast_armor_radiance_debuff:IsPurgable() return false end

function modifier_item_beast_armor_radiance_debuff:OnCreated()
    if not IsServer() then return end
    if not self:GetAbility() then return end

    self.aura_damage = self:GetAbility():GetSpecialValueFor("aura_damage")
    self.blind_pct = self:GetAbility():GetSpecialValueFor("blind_pct")

    self:StartIntervalThink(1.0)
end

function modifier_item_beast_armor_radiance_debuff:OnIntervalThink()
    if not IsServer() then return end

    ApplyDamage({
        victim = self:GetParent(),
        attacker = self:GetCaster(),
        damage = self.aura_damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = self:GetAbility()
    })
end

function modifier_item_beast_armor_radiance_debuff:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MISS_PERCENTAGE,
    }
end

function modifier_item_beast_armor_radiance_debuff:GetModifierMiss_Percentage()
    return self.blind_pct
end

function modifier_item_beast_armor_radiance_debuff:GetEffectName()
    return "particles/items2_fx/radiance.vpcf"
end

function modifier_item_beast_armor_radiance_debuff:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end

-- ========================================
-- 主动反弹modifier（100%反伤）- 删除重复定义
-- ========================================
modifier_item_beast_armor_active = class({})

function modifier_item_beast_armor_active:IsHidden() return false end

function modifier_item_beast_armor_active:IsPurgable() return false end

function modifier_item_beast_armor_active:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_TAKEDAMAGE,
    }
end

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

-- 主动100%反伤（只保留一个定义）
function modifier_item_beast_armor_active:OnTakeDamage(params)
    if not IsServer() then return end
    if params.unit ~= self:GetParent() then return end
    if params.attacker == self:GetParent() then return end
    if not params.attacker:IsAlive() then return end

    -- 检查是否来自其他刃甲反伤
    if bit.band(params.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) == DOTA_DAMAGE_FLAG_REFLECTION then
        return
    end

    -- 主动反伤：使用减免前的伤害 * 100%
    local reflect_damage = params.original_damage * self.reflection_pct / 100

    ApplyDamage({
        victim = params.attacker,
        attacker = self:GetParent(),
        damage = reflect_damage,
        damage_type = params.damage_type,
        ability = self:GetAbility(),
        damage_flags = DOTA_DAMAGE_FLAG_REFLECTION + DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    })
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

