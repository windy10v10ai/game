modifier_abyss = class({})

function modifier_abyss:IsPurgable() return false end
function modifier_abyss:RemoveOnDeath() return false end
function modifier_abyss:GetTexture() return "player/abyss" end

function modifier_abyss:OnCreated()
	self.iAttackDamage = 20
	self.iSpellAmp = 5
end

function modifier_abyss:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_abyss:GetModifierPreAttack_BonusDamage()
	return self.iAttackDamage
end

function modifier_abyss:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmp
end
