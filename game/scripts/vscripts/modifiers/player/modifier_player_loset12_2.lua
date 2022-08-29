modifier_player_loset12_2 = class({})

function modifier_player_loset12_2:IsPurgable() return false end
function modifier_player_loset12_2:RemoveOnDeath() return false end
function modifier_player_loset12_2:GetTexture() return "player/loset12_2" end

function modifier_player_loset12_2:OnCreated()
	self.iSpellAmplify = 20
end

function modifier_player_loset12_2:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_player_loset12_2:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end
