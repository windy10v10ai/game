modifier_player_ekxn = class({})

function modifier_player_ekxn:IsPurgable() return false end
function modifier_player_ekxn:RemoveOnDeath() return false end
function modifier_player_ekxn:GetTexture() return "player/plusIcon" end

function modifier_player_ekxn:OnCreated()
	self.iMoveSpeed = 50
end

function modifier_player_ekxn:DeclareFunctions()
	return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end

function modifier_player_ekxn:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
