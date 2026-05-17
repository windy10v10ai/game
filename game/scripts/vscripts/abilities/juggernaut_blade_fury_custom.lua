juggernaut_blade_fury_custom = class({})

modifier_juggernaut_blade_fury_custom = class({})
LinkLuaModifier("modifier_juggernaut_blade_fury_custom", "abilities/juggernaut_blade_fury_custom",
    LUA_MODIFIER_MOTION_NONE)

function juggernaut_blade_fury_custom:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("duration")
    caster:AddNewModifier(caster, self, "modifier_juggernaut_blade_fury_custom", { duration = duration })
    caster:StopSound("Hero_Juggernaut.BladeFuryStart")
    caster:EmitSound("Hero_Juggernaut.BladeFuryStart")
end

function modifier_juggernaut_blade_fury_custom:IsPurgable() return false end

function modifier_juggernaut_blade_fury_custom:OnCreated(kv)
    if not IsServer() then return end

    local caster = self:GetCaster()
    local ability = self:GetAbility()
    local damage_reduction_pct = ability:GetSpecialValueFor("damage_reduction_pct") or 50
    local total_attack_damage = caster:GetAverageTrueAttackDamage(nil) or 1000
    self.damage_reduction = -total_attack_damage * damage_reduction_pct / 100

    self:SetHasCustomTransmitterData(true)
    local radius = ability:GetSpecialValueFor("radius")
    self.particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_juggernaut/juggernaut_blade_fury.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:SetParticleControl(self.particle, 5, Vector(radius, 0, 0))
    self:StartIntervalThink(0.5)
end

function modifier_juggernaut_blade_fury_custom:AddCustomTransmitterData()
    return { damage_reduction = self.damage_reduction or 0 }
end

function modifier_juggernaut_blade_fury_custom:HandleCustomTransmitterData(data)
    self.damage_reduction = data.damage_reduction
end

function modifier_juggernaut_blade_fury_custom:OnDestroy()
    if not IsServer() then return end
    local caster = self:GetParent()
    if self.particle then
        ParticleManager:DestroyParticle(self.particle, false)
    end
    StopSoundOn("Hero_Juggernaut.BladeFuryStart", caster)
end

function modifier_juggernaut_blade_fury_custom:OnIntervalThink()
    if not IsServer() then return end

    local caster = self:GetCaster()
    local ability = self:GetAbility()
    local radius = ability:GetSpecialValueFor("radius")
    local base_damage = ability:GetSpecialValueFor("damage")
    local attack_damage = caster:GetAverageTrueAttackDamage(nil)

    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(), caster:GetAbsOrigin(), nil, radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES, FIND_ANY_ORDER, false)

    for _, enemy in pairs(enemies) do
        ApplyDamage({
            victim = enemy,
            attacker = caster,
            damage = attack_damage + base_damage * 0.5,
            damage_type = DAMAGE_TYPE_MAGICAL,
            ability = ability
        })
    end
end

function modifier_juggernaut_blade_fury_custom:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
        MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
    }
end

function modifier_juggernaut_blade_fury_custom:GetModifierMoveSpeedBonus_Constant()
    return self:GetAbility():GetSpecialValueFor("talent_bonus_movespeed") or 0
end

function modifier_juggernaut_blade_fury_custom:GetModifierMagicalResistanceBonus()
    return self:GetAbility():GetSpecialValueFor("magic_resistance_bonus") or 0
end

function modifier_juggernaut_blade_fury_custom:GetTexture()
    return "juggernaut_blade_fury"
end

function modifier_juggernaut_blade_fury_custom:CheckState()
    return {
        [MODIFIER_STATE_MAGIC_IMMUNE] = true,
        [MODIFIER_STATE_DEBUFF_IMMUNE] = true,
    }
end

function modifier_juggernaut_blade_fury_custom:GetModifierPreAttack_BonusDamage()
    return self.damage_reduction or 0
end
