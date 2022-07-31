modifier_player_rwby = class({})

function modifier_player_rwby:IsPurgable() return false end
function modifier_player_rwby:RemoveOnDeath() return false end
function modifier_player_rwby:GetTexture() return "player/rwby" end

function modifier_player_rwby:OnCreated()
	self.iMoveSpeed = 50
end
function modifier_player_rwby:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end


function modifier_player_rwby:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
