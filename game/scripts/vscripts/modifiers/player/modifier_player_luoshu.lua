modifier_player_luoshu = class({})

function modifier_player_luoshu:IsPurgable() return false end
function modifier_player_luoshu:RemoveOnDeath() return false end
function modifier_player_luoshu:GetTexture() return "player/luoshu" end

function modifier_player_luoshu:OnCreated()
	self.strength = 40
	self.agility = 40
	self.intellect = 40
	self.iCooldownReduction = 35
	self.iStatusResist = 16
end


function modifier_player_luoshu:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
	}
end

function modifier_player_luoshu:GetModifierBonusStats_Strength()
	return self.strength
end

function modifier_player_luoshu:GetModifierBonusStats_Agility()
	return self.agility
end

function modifier_player_luoshu:GetModifierBonusStats_Intellect()
	return self.intellect
end

function modifier_player_luoshu:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_luoshu:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end
