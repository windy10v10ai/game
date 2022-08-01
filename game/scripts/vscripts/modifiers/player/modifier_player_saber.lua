modifier_player_saber = class({})

function modifier_player_saber:IsPurgable() return false end
function modifier_player_saber:RemoveOnDeath() return false end
function modifier_player_saber:GetTexture() return "player/saber" end


function modifier_player_saber:OnCreated()
	self.iAttackDamage = 20
	self.iSpellAmp = 5
end

function modifier_player_saber:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_player_saber:GetModifierPreAttack_BonusDamage()
	return self.iAttackDamage
end

function modifier_player_saber:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmp
end
