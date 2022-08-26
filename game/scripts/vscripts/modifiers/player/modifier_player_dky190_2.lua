modifier_player_dky190_2 = class({})

function modifier_player_dky190_2:IsPurgable() return false end
function modifier_player_dky190_2:RemoveOnDeath() return false end
function modifier_player_dky190_2:GetTexture() return "player/dky190_2" end

function modifier_player_dky190_2:OnCreated()
	self.iMoveSpeed = 200
end
function modifier_player_dky190_2:DeclareFunctions()
	return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
	}
end

function modifier_player_dky190_2:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_dky190_2:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_dky190_2:GetModifierIgnoreMovespeedLimit()
    return 1
end
