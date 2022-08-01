modifier_player_goku = class({})

function modifier_player_goku:IsPurgable() return false end
function modifier_player_goku:RemoveOnDeath() return false end
function modifier_player_goku:GetTexture() return "player/goku" end


function modifier_player_goku:OnCreated()
	self.iAttackDamage = 20
	self.iSpellAmp = 5
end

function modifier_player_goku:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_player_goku:GetModifierPreAttack_BonusDamage()
	return self.iAttackDamage
end

function modifier_player_goku:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmp
end
