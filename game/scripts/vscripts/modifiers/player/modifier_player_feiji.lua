modifier_player_feiji = class({})

function modifier_player_feiji:IsPurgable() return false end
function modifier_player_feiji:RemoveOnDeath() return false end
function modifier_player_feiji:GetTexture() return "player/feiji" end

function modifier_player_feiji:OnCreated()
	self.strength = 60
	self.agility = 60
	self.intellect = 60
end


function modifier_player_feiji:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
	}
end


function modifier_player_feiji:GetModifierBonusStats_Strength()
	return self.strength
end

function modifier_player_feiji:GetModifierBonusStats_Agility()
	return self.agility
end

function modifier_player_feiji:GetModifierBonusStats_Intellect()
	return self.intellect
end
