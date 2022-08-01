modifier_player_mimihua = class({})

function modifier_player_mimihua:IsPurgable() return false end
function modifier_player_mimihua:RemoveOnDeath() return false end
function modifier_player_mimihua:GetTexture() return "player/mimihua" end

function modifier_player_mimihua:OnCreated()
	self.iCooldownReduction = 35
	self.iStatusResist = 40
	self.iCastRange = 200
	self.iHealthRegen = 1.0
	self.iIncomingDamage = -15
end

function modifier_player_mimihua:CheckState()
	return {
		[MODIFIER_STATE_CANNOT_MISS] = true,
	}
end

function modifier_player_mimihua:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
		MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE_UNIQUE,
		MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
	}
end


function modifier_player_mimihua:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_mimihua:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end

function modifier_player_mimihua:GetModifierCastRangeBonusStacking()
	return self.iCastRange
end

function modifier_player_mimihua:GetModifierHealthRegenPercentageUnique()
	return self.iHealthRegen
end

function modifier_player_mimihua:GetModifierIncomingDamage_Percentage()
	return self.iIncomingDamage
end
