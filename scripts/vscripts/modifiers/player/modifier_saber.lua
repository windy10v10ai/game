modifier_saber = class({})

function modifier_saber:IsPurgable() return false end
function modifier_saber:RemoveOnDeath() return false end
function modifier_saber:GetTexture() return "player/saber" end


function modifier_saber:OnCreated()
	self.iAttackDamage = 20
	self.iSpellAmp = 5
end

function modifier_saber:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_saber:GetModifierPreAttack_BonusDamage()
	return self.iAttackDamage
end

function modifier_saber:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmp
end
