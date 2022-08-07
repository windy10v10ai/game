modifier_player_luoshu = class({})

function modifier_player_luoshu:IsPurgable() return false end
function modifier_player_luoshu:RemoveOnDeath() return false end
function modifier_player_luoshu:GetTexture() return "player/luoshu" end

function modifier_player_luoshu:OnCreated()
	self.strength = 60
	self.agility = 60
	self.intellect = 60
	self.iCooldownReduction = 35
	self.iStatusResist = 16
	self.iMoveSpeed = 30
	self.iBonusDamage = 60
end


function modifier_player_luoshu:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
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

function modifier_player_luoshu:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_luoshu:GetModifierPreAttack_BonusDamage()
	return self.iBonusDamage
end
