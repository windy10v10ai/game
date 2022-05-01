modifier_76 = class({})

function modifier_76:IsPurgable() return false end
function modifier_76:RemoveOnDeath() return false end
function modifier_76:GetTexture() return "player/76" end

function modifier_76:OnCreated()
	self.iMoveSpeed = 76
end
function modifier_76:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end


function modifier_76:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
