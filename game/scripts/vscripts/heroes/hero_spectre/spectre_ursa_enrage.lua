LinkLuaModifier("modifier_spectre_ursa_enrage", "heroes/hero_spectre/spectre_ursa_enrage", LUA_MODIFIER_MOTION_NONE)

spectre_ursa_enrage = class({})

function spectre_ursa_enrage:OnSpellStart()
    self.caster = self:GetCaster()
    self.duration = self:GetSpecialValueFor('duration')
    self.caster:EmitSound('Hero_Spectre.Haunt')
    self.caster:AddNewModifier(self.caster, self, "modifier_spectre_ursa_enrage", { duration = self.duration })
end

modifier_spectre_ursa_enrage = class({})
function modifier_spectre_ursa_enrage:IsHidden() return false end
function modifier_spectre_ursa_enrage:IsDebuff() return false end
function modifier_spectre_ursa_enrage:IsPurgable() return false end
function modifier_spectre_ursa_enrage:IsPurgeException() return false end
function modifier_spectre_ursa_enrage:RemoveOnDeath() return true end
function modifier_spectre_ursa_enrage:AllowIllusionDuplicate() return false end
function modifier_spectre_ursa_enrage:GetTexture() return "spe_new_ultimate" end

function modifier_spectre_ursa_enrage:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
        MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
    }
end

function modifier_spectre_ursa_enrage:GetModifierIncomingDamage_Percentage()
    return self.damageReduction
end

function modifier_spectre_ursa_enrage:GetModifierStatusResistanceStacking()
    return self.statusResistance
end

function modifier_spectre_ursa_enrage:OnCreated(table)
    self.ability = self:GetAbility()
    self.caster = self:GetParent()
    self.damageReduction = self.ability:GetSpecialValueFor('damage_reduction')
    self.statusResistance = self.ability:GetSpecialValueFor('status_resistance')
    self.particleId = ParticleManager:CreateParticle("particles/yukari_true_moon.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.caster)
end

function modifier_spectre_ursa_enrage:OnRefresh(table)
    self:OnCreated(table)
end

function modifier_spectre_ursa_enrage:OnDestroy()
    ParticleManager:DestroyParticle(self.particleId, true)
    ParticleManager:ReleaseParticleIndex(self.particleId)
end
