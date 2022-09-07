modifier_player_vjes = class({})

function modifier_player_vjes:IsPurgable() return false end
function modifier_player_vjes:RemoveOnDeath() return false end
function modifier_player_vjes:GetTexture() return "player/plusIcon" end

function modifier_player_vjes:OnCreated()
	self.strength = 20
end
function modifier_player_vjes:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
	}
end

function modifier_player_vjes:GetModifierBonusStats_Strength()
	return self.strength
end
