modifier_windy = class({})

function modifier_windy:IsPurgable() return false end
function modifier_windy:RemoveOnDeath() return false end
function modifier_windy:GetTexture() return "player/windy" end

function modifier_windy:OnCreated()
	if IsServer() then
		self.iCooldownReduction = 30
		self.iStatusResist = 30
		self.iCastRange = 200
	end
end

function modifier_windy:CheckState()
	return {
		[MODIFIER_STATE_CANNOT_MISS] = true,
	}
end

function modifier_windy:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
	}
end


function modifier_windy:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_windy:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end

function modifier_windy:GetModifierCastRangeBonusStacking()
	return self.iCastRange
end
