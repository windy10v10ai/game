modifier_adolphzero = class({})

function modifier_adolphzero:IsPurgable() return false end
function modifier_adolphzero:RemoveOnDeath() return false end
function modifier_adolphzero:GetTexture() return "player/adolphzero" end

function modifier_adolphzero:OnCreated()
	self.iMoveSpeed = 50
end
function modifier_adolphzero:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end


function modifier_adolphzero:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
