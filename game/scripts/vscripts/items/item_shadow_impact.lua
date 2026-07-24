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

    -- 1. 死灵法杖变羊 (降低魔抗)
    self:ApplyNecrolyteSheep(target)

    -- 2. 死灵法杖伤害 + 达贡能量冲击 (合并为一次魔法伤害，享受降低后的魔抗)
    self:ApplyNecrolyteAndDagonDamage(target)

    -- 3. 纯粹伤害
    self:ApplyPureDamage(target)

    -- 4. 绝刃被动 (法术强化：额外法术伤害+减速+破坏被动技能)
    self:ApplyAngelsDemiseEffect(target)

    -- 主特效
    local particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_necrolyte/necrolyte_pulse.vpcf",
        PATTACH_ABSORIGIN_FOLLOW,
        target
    )
    ParticleManager:ReleaseParticleIndex(particle)

    -- AbilityCooldown 是被动冷却，这里覆盖成吃冷却缩减的主动真实冷却
    local cooldown = self:GetSpecialValueFor("active_cooldown")
    self:StartCooldown(cooldown * caster:GetCooldownReduction())
end

function item_shadow_impact:ApplyNecrolyteSheep(target)
    local caster = self:GetCaster()

    -- 变羊效果 降低魔抗
    local duration = self:GetSpecialValueFor("sheep_duration") * (1 - target:GetStatusResistance())
    target:AddNewModifier(caster, self, "modifier_shadow_impact_sheep", { duration = duration })

    EmitSoundOn("DOTA_Item.Sheepstick.Activate", target)
end

function item_shadow_impact:ApplyNecrolyteAndDagonDamage(target)
    local caster = self:GetCaster()

    -- 死灵冲击伤害 - 基于全属性
    local blast_att_multiplier = self:GetSpecialValueFor("necrolyte_att_multiplier")
    local allAtt = caster:GetStrength() + caster:GetAgility() + caster:GetIntellect(false)
    local necrolyte_damage = allAtt * blast_att_multiplier

    local dagon_damage = self:GetSpecialValueFor("dagon_damage")

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = necrolyte_damage + dagon_damage,
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

    -- 使用更强的音效
    EmitSoundOn("Hero_Lion.FingerOfDeath", target)
end

function item_shadow_impact:ApplyPureDamage(target)
    local caster = self:GetCaster()
    local damage = self:GetSpecialValueFor("pure_damage")

    ApplyDamage({
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_PURE,
        ability = self
    })
end

function item_shadow_impact:ApplyAngelsDemiseEffect(target)
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("slow_duration") * (1 - target:GetStatusResistance())

    -- 借用的原生充能被动不保证自动触发，主动连招里手动补挂目标 debuff
    target:AddNewModifier(caster, self, "modifier_item_angels_demise_slow", { duration = duration })
    target:AddNewModifier(caster, self, "modifier_item_angels_demise_break", { duration = duration })
end

-- 被动modifier
modifier_item_shadow_impact = class({})

function modifier_item_shadow_impact:IsHidden() return true end

function modifier_item_shadow_impact:IsPurgable() return false end

function modifier_item_shadow_impact:RemoveOnDeath() return false end

function modifier_item_shadow_impact:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_shadow_impact:OnCreated(params)
    self:OnRefresh(params)

    if not self:GetAbility() then return end
    local ability = self:GetAbility()

    -- bonus_cast_range 不在可优化列表中，需要在 Lua 中实现
    self.bonus_cast_range = ability:GetSpecialValueFor("bonus_cast_range")
end

function modifier_item_shadow_impact:OnRefresh(params)
    self.stats_modifier_name = "modifier_item_shadow_impact_stats"

    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)

        -- 借用绝刃原生被动（法术强化：下个单体技能附加伤害+破坏+减速）
        local parent = self:GetParent()
        local ability = self:GetAbility()
        parent:RemoveModifierByName("modifier_item_angels_demise")
        parent:AddNewModifier(parent, ability, "modifier_item_angels_demise", {})
    end
end

function modifier_item_shadow_impact:OnDestroy()
    if IsServer() then
        RefreshItemDataDrivenModifier(_, self:GetAbility(), self.stats_modifier_name)
        self:GetParent():RemoveModifierByName("modifier_item_angels_demise")
    end
end

function modifier_item_shadow_impact:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_CAST_RANGE_BONUS,
    }
end

function modifier_item_shadow_impact:GetModifierCastRangeBonus()
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
    if self:GetAbility() then
        self.sheep_movement_speed = self:GetAbility():GetSpecialValueFor("sheep_movement_speed") or 140
        self.blast_magic_resist = self:GetAbility():GetSpecialValueFor("blast_magic_resist")
    end

    if not IsServer() then return end

    local model_list = { "models/props_gameplay/pig.vmdl", "models/props_gameplay/sheep01.vmdl" }
    self.model_file = model_list[RandomInt(1, #model_list)]
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
        MODIFIER_PROPERTY_MAGICAL_RESISTANCE_DIRECT_MODIFICATION,
    }
end

function modifier_shadow_impact_sheep:GetModifierMoveSpeedOverride()
    return self.sheep_movement_speed or 140
end

function modifier_shadow_impact_sheep:GetModifierModelChange()
    return self.model_file
end

function modifier_shadow_impact_sheep:GetModifierMagicalResistanceDirectModification()
    return self.blast_magic_resist
end
