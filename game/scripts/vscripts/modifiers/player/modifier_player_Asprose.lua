modifier_player_asprose = class({})

function modifier_player_asprose:IsPurgable() return false end
function modifier_player_asprose:RemoveOnDeath() return false end
function modifier_player_asprose:GetTexture() return "player/asprose" end

function modifier_player_asprose:OnCreated()
	self.iMoveSpeed = 50
	self.iCooldownReduction = 32
end
function modifier_player_asprose:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
		MODIFIER_PROPERTY_MOVESPEED_LIMIT,
	}
end


function modifier_player_asprose:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_asprose:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_asprose:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_asprose:GetModifierIgnoreMovespeedLimit()
    return 1
end
