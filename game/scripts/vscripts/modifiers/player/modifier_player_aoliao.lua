modifier_player_aoliao = class({})

function modifier_player_aoliao:IsPurgable() return false end
function modifier_player_aoliao:RemoveOnDeath() return false end
function modifier_player_aoliao:GetTexture() return "player/plusIcon" end

function modifier_player_aoliao:OnCreated()
	self.iCooldownReduction = 32
	self.iMoveSpeed = 100
	self.iCastRangeBonus = 200
	self.iSpellAmplify = 40
end

function modifier_player_aoliao:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end


function modifier_player_aoliao:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_aoliao:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_aoliao:GetModifierCastRangeBonusStacking()
	return self.iCastRangeBonus
end

function modifier_player_aoliao:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end

