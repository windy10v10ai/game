modifier_player_shapu = class({})

function modifier_player_shapu:IsPurgable() return false end
function modifier_player_shapu:RemoveOnDeath() return false end
function modifier_player_shapu:GetTexture() return "player/plusIcon" end

function modifier_player_shapu:OnCreated()
	local primaryAttributeBouns = 20
	self.strength = 0
	self.agility = 0
	self.intellect = 0
	-- get parent's primary attribute
	local primaryAttribute = self:GetParent():GetPrimaryAttribute()
	if primaryAttribute == 0 then
		self.strength = self.strength + primaryAttributeBouns
	elseif primaryAttribute == 1 then
		self.agility = self.agility + primaryAttributeBouns
	elseif primaryAttribute == 2 then
		self.intellect = self.intellect + primaryAttributeBouns
	end
end


function modifier_player_shapu:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
	}
end


function modifier_player_shapu:GetModifierBonusStats_Strength()
	return self.strength
end

function modifier_player_shapu:GetModifierBonusStats_Agility()
	return self.agility
end

function modifier_player_shapu:GetModifierBonusStats_Intellect()
	return self.intellect
end
