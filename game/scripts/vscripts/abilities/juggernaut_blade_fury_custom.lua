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
    local ability = self:GetAbility()
    self.movespeed_bonus = ability:GetSpecialValueFor("talent_bonus_movespeed")
    self.magic_resistance = ability:GetSpecialValueFor("magic_resistance_bonus")
    self.radius = ability:GetSpecialValueFor("radius")

    if not IsServer() then return end

    local caster = self:GetCaster()
    local attack_damage = caster:GetAverageTrueAttackDamage(nil)
    local damage_reduction_pct = ability:GetSpecialValueFor("damage_reduction_pct")
    self.damage_reduction = -attack_damage * damage_reduction_pct / 100
    self.base_tick = ability:GetSpecialValueFor("damage") * 0.5
    self.health_pct_tick = ability:GetSpecialValueFor("health_damage_pct") / 100 * 0.5

    self:SetHasCustomTransmitterData(true)
    self.particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_juggernaut/juggernaut_blade_fury.vpcf", PATTACH_ABSORIGIN_FOLLOW, caster)
    ParticleManager:SetParticleControl(self.particle, 5, Vector(self.radius, 0, 0))
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
    -- 旋转结束对自身强效驱散，清掉身上 debuff/控制
    caster:Purge(false, true, false, true, true)
end

function modifier_juggernaut_blade_fury_custom:OnIntervalThink()
    if not IsServer() then return end

    local caster = self:GetCaster()
    local ability = self:GetAbility()

    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(), caster:GetAbsOrigin(), nil, self.radius,
        DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES, FIND_ANY_ORDER, false)

    for _, enemy in pairs(enemies) do
        ApplyDamage({
            victim = enemy,
            attacker = caster,
            damage = self.base_tick + enemy:GetMaxHealth() * self.health_pct_tick,
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
    return self.movespeed_bonus or 0
end

function modifier_juggernaut_blade_fury_custom:GetModifierMagicalResistanceBonus()
    return self.magic_resistance or 0
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
