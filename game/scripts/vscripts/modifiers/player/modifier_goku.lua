modifier_goku = class({})

function modifier_goku:IsPurgable() return false end
function modifier_goku:RemoveOnDeath() return false end
function modifier_goku:GetTexture() return "player/goku" end


function modifier_goku:OnCreated()
	self.iAttackDamage = 20
	self.iSpellAmp = 5
end

function modifier_goku:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_goku:GetModifierPreAttack_BonusDamage()
	return self.iAttackDamage
end

function modifier_goku:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmp
end
