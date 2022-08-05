modifier_player_xin = class({})

function modifier_player_xin:IsPurgable() return false end
function modifier_player_xin:RemoveOnDeath() return false end
function modifier_player_xin:GetTexture() return "player/xin" end

function modifier_player_xin:OnCreated()
	local primaryAttributeBouns = 60
	self.strength = 20
	self.agility = 20
	self.intellect = 20
	-- get parent's primary attribute
	if IsClient() then return end
	local primaryAttribute = self:GetParent():GetPrimaryAttribute()
	if primaryAttribute == 0 then
		self.strength = self.strength + primaryAttributeBouns
	elseif primaryAttribute == 1 then
		self.agility = self.agility + primaryAttributeBouns
	elseif primaryAttribute == 2 then
		self.intellect = self.intellect + primaryAttributeBouns
	end
end


function modifier_player_xin:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
	}
end

function modifier_player_xin:GetModifierBonusStats_Strength()
	return self.strength
end

function modifier_player_xin:GetModifierBonusStats_Agility()
	return self.agility
end

function modifier_player_xin:GetModifierBonusStats_Intellect()
	return self.intellect
end
