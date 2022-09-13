modifier_player_cyn1 = class({})

function modifier_player_cyn1:IsPurgable() return false end
function modifier_player_cyn1:RemoveOnDeath() return false end
function modifier_player_cyn1:GetTexture() return "player/cyn1" end

function modifier_player_cyn1:OnCreated()
	self.iCooldownReduction = 10
	self.iMoveSpeed = 200
end

function modifier_player_cyn1:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
	}
end

function modifier_player_cyn1:GetPriority()
	return MODIFIER_PRIORITY_SUPER_ULTRA
end

function modifier_player_cyn1:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_cyn1:GetModifierBaseAttackTimeConstant()
    return 1
end

function modifier_player_cyn1:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_cyn1:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_cyn1:GetModifierIgnoreMovespeedLimit()
    return 1
end
