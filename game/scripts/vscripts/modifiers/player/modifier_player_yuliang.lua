modifier_player_yuliang = class({})

function modifier_player_yuliang:IsPurgable() return false end
function modifier_player_yuliang:RemoveOnDeath() return false end
function modifier_player_yuliang:GetTexture() return "player/yuliang" end

function modifier_player_yuliang:OnCreated()
	self.iMoveSpeed = 200
end

function modifier_player_yuliang:DeclareFunctions()
	return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
	}
end

function modifier_player_yuliang:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_yuliang:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_yuliang:GetModifierIgnoreMovespeedLimit()
    return 1
end
