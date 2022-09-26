modifier_player_uh9g = class({})

function modifier_player_uh9g:IsPurgable() return false end
function modifier_player_uh9g:RemoveOnDeath() return false end
function modifier_player_uh9g:GetTexture() return "player/plusIcon" end

function modifier_player_uh9g:OnCreated()
	self.iSpellAmplify = 40
end

function modifier_player_uh9g:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_player_uh9g:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end

