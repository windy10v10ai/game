modifier_player_puck1609 = class({})

function modifier_player_puck1609:IsPurgable() return false end
function modifier_player_puck1609:RemoveOnDeath() return false end
function modifier_player_puck1609:GetTexture() return "player/puck1609" end

function modifier_player_puck1609:OnCreated()
	self.iCooldownReduction = 40
	self.iStatusResist = 40
	self.iCastRange = 400
	self.iMoveSpeed = 200
	self.iArmor = 40
	self.iMagicalResist = 40
end

function modifier_player_puck1609:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
		MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
		MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
	}
end

function modifier_player_puck1609:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_puck1609:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end

function modifier_player_puck1609:GetModifierCastRangeBonus()
	return self.iCastRange
end

function modifier_player_puck1609:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_puck1609:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_puck1609:GetModifierIgnoreMovespeedLimit()
    return 1
end

function modifier_player_puck1609:GetModifierPhysicalArmorBonus()
    return self.iArmor
end

function modifier_player_puck1609:GetModifierMagicalResistanceBonus()
	return self.iMagicalResist
end
