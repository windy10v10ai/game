modifier_player_sushi = class({})

function modifier_player_sushi:IsPurgable() return false end
function modifier_player_sushi:RemoveOnDeath() return false end
function modifier_player_sushi:GetTexture() return "player/sushi" end

function modifier_player_sushi:OnCreated()
	self.iSpellAmplify = 10
end

function modifier_player_sushi:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_player_sushi:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end
