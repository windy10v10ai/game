modifier_player_puck1609 = class({})

function modifier_player_puck1609:IsPurgable() return false end
function modifier_player_puck1609:RemoveOnDeath() return false end
function modifier_player_puck1609:GetTexture() return "player/puck1609" end

function modifier_player_puck1609:OnCreated()
	self.iCooldownReduction = 40
	self.iCastRangeBonus = 400
	self.iSpellAmplify = 40
	self.iMoveSpeed = 100
	self.iHealthRegenPercentage = 2
	self.iManaRegenPercentage = 2
	self.iMagicalResist = 40
end

function modifier_player_puck1609:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE,
		MODIFIER_PROPERTY_MANA_REGEN_TOTAL_PERCENTAGE,
		MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
	}
end

function modifier_player_puck1609:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_puck1609:GetModifierCastRangeBonusStacking()
	return self.iCastRangeBonus
end

function modifier_player_puck1609:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end

function modifier_player_puck1609:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_puck1609:GetModifierHealthRegenPercentage()
	return self.iHealthRegenPercentage
end

function modifier_player_puck1609:GetModifierTotalPercentageManaRegen()
	return self.iManaRegenPercentage
end

function modifier_player_puck1609:GetModifierMagicalResistanceBonus()
	return self.iMagicalResist
end
