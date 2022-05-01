modifier_windy = class({})

function modifier_windy:IsPurgable() return false end
function modifier_windy:RemoveOnDeath() return false end
function modifier_windy:GetTexture() return "player/windy" end

function modifier_windy:OnCreated()
	-- self.iCooldownReduction = 40
	self.iStatusResist = 40
	self.iCastRange = 400
end

function modifier_windy:CheckState()
	return {
		[MODIFIER_STATE_CANNOT_MISS] = true,
	}
end

function modifier_windy:DeclareFunctions()
	return {
		-- MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS,
	}
end


-- function modifier_windy:GetModifierPercentageCooldown()
-- 	return self.iCooldownReduction
-- end

function modifier_windy:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end

function modifier_windy:GetModifierCastRangeBonus()
	return self.iCastRange
end
