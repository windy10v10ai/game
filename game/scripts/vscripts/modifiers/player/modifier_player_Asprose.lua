modifier_player_Asprose = class({})

function modifier_player_Asprose:IsPurgable() return false end
function modifier_player_Asprose:RemoveOnDeath() return false end
function modifier_player_Asprose:GetTexture() return "player/Asprose" end

function modifier_player_Asprose:OnCreated()
	self.iMoveSpeed = 50
	self.iCooldownReduction = 32
end
function modifier_player_Asprose:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
		MODIFIER_PROPERTY_MOVESPEED_LIMIT,
	}
end


function modifier_player_Asprose:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_Asprose:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_Asprose:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_Asprose:GetModifierIgnoreMovespeedLimit()
    return 1
end
