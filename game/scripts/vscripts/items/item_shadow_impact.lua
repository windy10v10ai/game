LinkLuaModifier("modifier_item_shadow_impact", "items/item_shadow_impact", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_shadow_impact_sheep", "items/item_shadow_impact", LUA_MODIFIER_MOTION_NONE)

item_shadow_impact = class({})

function item_shadow_impact:GetIntrinsicModifierName()
    return "modifier_item_shadow_impact"
end

function item_shadow_impact:OnSpellStart()
    local caster = self:GetCaster()
    local target = self:GetCursorTarget()

    if target:TriggerSpellAbsorb(self) then
        return
    end

    -- 1. 达贡能量冲击
    self:ApplyDagonEffect(target)

    -- 2. 虚灵之刃效果
    self:ApplyEtherealBladeEffect(target)

    -- 3. 死灵法杖效果 (伤害+变羊)
    self:ApplyNecrolyteEffect(target)

    -- 4. 绝刃效果 (额外纯粹伤害)
    self:ApplyAbsoluteDamage(target)

    -- 主特效
    local particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_necrolyte/necrolyte_pulse.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        target
    )
    ParticleManager:ReleaseParticleIndex(particle)
end

function item_shadow_impact:ApplyDagonEffect(target)
    local caster = self:GetCaster()
    local damage = self:GetSpecialValueFor("dagon_damage")

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = self
    })

    local particle = ParticleManager:CreateParticle(
        "particles/items_fx/dagon.vpcf",
        PATTACH_CUSTOMORIGIN,
        caster
    )
    ParticleManager:SetParticleControlEnt(particle, 0, caster, PATTACH_POINT_FOLLOW, "attach_attack1",
        caster:GetAbsOrigin(), true)
    ParticleManager:SetParticleControlEnt(particle, 1, target, PATTACH_POINT_FOLLOW, "attach_hitloc",
        target:GetAbsOrigin(), true)
    ParticleManager:ReleaseParticleIndex(particle)

    EmitSoundOn("DOTA_Item.Dagon5.Activate", caster)
end

function item_shadow_impact:ApplyEtherealBladeEffect(target)
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("ethereal_duration") * (1 - target:GetStatusResistance())

    -- 计算虚灵之刃伤害
    local primary_stat = 0
    if caster:GetPrimaryAttribute() == DOTA_ATTRIBUTE_STRENGTH then
        primary_stat = caster:GetStrength()
    elseif caster:GetPrimaryAttribute() == DOTA_ATTRIBUTE_AGILITY then
        primary_stat = caster:GetAgility()
    elseif caster:GetPrimaryAttribute() == DOTA_ATTRIBUTE_INTELLECT then
        primary_stat = caster:GetIntellect(false)
    end

    local damage = self:GetSpecialValueFor("blast_damage_base") +
        primary_stat * self:GetSpecialValueFor("blast_agility_multiplier")

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = self
    })

    -- 添加虚灵状态
    target:AddNewModifier(caster, self, "modifier_item_ethereal_blade_ethereal", { duration = duration })
    target:AddNewModifier(caster, self, "modifier_item_ethereal_blade_slow", { duration = duration })

    local particle = ParticleManager:CreateParticle(
        "particles/items2_fx/ethereal_blade.vpcf",
        PATTACH_CUSTOMORIGIN,
        caster
    )
    ParticleManager:SetParticleControlEnt(particle, 0, caster, PATTACH_POINT_FOLLOW, "attach_attack1",
        caster:GetAbsOrigin(), true)
    ParticleManager:SetParticleControlEnt(particle, 1, target, PATTACH_POINT_FOLLOW, "attach_hitloc",
        target:GetAbsOrigin(), true)
    ParticleManager:ReleaseParticleIndex(particle)

    EmitSoundOn("DOTA_Item.EtherealBlade.Activate", caster)
end

function item_shadow_impact:ApplyNecrolyteEffect(target)
    local caster = self:GetCaster()

    -- 死灵冲击伤害 - 基于全属性
    local blast_att_multiplier = self:GetSpecialValueFor("necrolyte_att_multiplier")
    local allAtt = caster:GetStrength() + caster:GetAgility() + caster:GetIntellect(false)
    local damage = allAtt * blast_att_multiplier

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = self
    })

    -- 变羊效果
    local duration = self:GetSpecialValueFor("sheep_duration") * (1 - target:GetStatusResistance())
    target:AddNewModifier(caster, self, "modifier_shadow_impact_sheep", { duration = duration })

    EmitSoundOn("DOTA_Item.Sheepstick.Activate", target)
end

function item_shadow_impact:ApplyAbsoluteDamage(target)
    local caster = self:GetCaster()
    local damage = self:GetSpecialValueFor("absolute_damage")

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_PURE,
        ability = self
    })
end

-- 被动modifier
modifier_item_shadow_impact = class({})

function modifier_item_shadow_impact:IsHidden() return true end

function modifier_item_shadow_impact:IsPurgable() return false end

function modifier_item_shadow_impact:RemoveOnDeath() return false end

function modifier_item_shadow_impact:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_shadow_impact:OnCreated()
    self:OnRefresh()

    if not self:GetAbility() then return end
    local ability = self:GetAbility()

    -- bonus_cast_range 不在可优化列表中，需要在 Lua 中实现
    self.bonus_cast_range = ability:GetSpecialValueFor("bonus_cast_range")
end

function modifier_item_shadow_impact:OnRefresh()
    self.stats_modifier_name = "modifier_item_shadow_impact_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end

    -- 更新施法距离加成
    if self:GetAbility() then
        self.bonus_cast_range = self:GetAbility():GetSpecialValueFor("bonus_cast_range")
    end
end

function modifier_item_shadow_impact:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
    end
end

function modifier_item_shadow_impact:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
    }
end

function modifier_item_shadow_impact:GetModifierCastRangeBonusStacking()
    return self.bonus_cast_range or 0
end

-- 变羊debuff
modifier_shadow_impact_sheep = class({})

function modifier_shadow_impact_sheep:IsHidden() return false end

function modifier_shadow_impact_sheep:IsDebuff() return true end

function modifier_shadow_impact_sheep:IsPurgable() return true end

function modifier_shadow_impact_sheep:GetTexture()
    return "item_shadow_impact"
end

function modifier_shadow_impact_sheep:OnCreated()
    if not IsServer() then return end

    local model_list = { "models/props_gameplay/pig.vmdl", "models/props_gameplay/sheep01.vmdl" }
    self.model_file = model_list[RandomInt(1, #model_list)]

    if self:GetAbility() then
        self.sheep_movement_speed = self:GetAbility():GetSpecialValueFor("sheep_movement_speed") or 140
    end
end

function modifier_shadow_impact_sheep:CheckState()
    return {
        [MODIFIER_STATE_SILENCED] = true,
        [MODIFIER_STATE_MUTED] = true,
        [MODIFIER_STATE_DISARMED] = true,
        [MODIFIER_STATE_HEXED] = true,
    }
end

function modifier_shadow_impact_sheep:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BASE_OVERRIDE,
        MODIFIER_PROPERTY_MODEL_CHANGE,
    }
end

function modifier_shadow_impact_sheep:GetModifierMoveSpeedOverride()
    return self.sheep_movement_speed or 140
end

function modifier_shadow_impact_sheep:GetModifierModelChange()
    return self.model_file
end
