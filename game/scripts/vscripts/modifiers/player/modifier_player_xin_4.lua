modifier_player_xin_4 = class({})

function modifier_player_xin_4:IsPurgable() return false end
function modifier_player_xin_4:RemoveOnDeath() return false end
function modifier_player_xin_4:GetTexture() return "player/xin_4" end

function modifier_player_xin_4:OnCreated()
	self.iMoveSpeed = 200
end


function modifier_player_xin_4:DeclareFunctions()
	return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end

function modifier_player_xin_4:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
