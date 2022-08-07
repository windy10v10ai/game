modifier_player_luoshu = class({})

function modifier_player_luoshu:IsPurgable() return false end
function modifier_player_luoshu:RemoveOnDeath() return false end
function modifier_player_luoshu:GetTexture() return "player/luoshu" end

function modifier_player_luoshu:OnCreated()
	self.strength = 60
	self.agility = 60
	self.intellect = 60
	self.iCooldownReduction = 40
	self.iStatusResist = 16
	self.iMoveSpeed = 50
	self.iBonusDamage = 60
	self.iSpellAmp = 60
	self.iCastRange = 250
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
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS,
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

function modifier_player_luoshu:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmp
end

function modifier_player_luoshu:GetModifierCastRangeBonus()
	return self.iCastRange
end
