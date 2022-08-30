modifier_player_chuyin = class({})

function modifier_player_chuyin:IsPurgable() return false end
function modifier_player_chuyin:RemoveOnDeath() return false end
function modifier_player_chuyin:GetTexture() return "player/chuyin" end

function modifier_player_chuyin:OnCreated()
	self.iAttackRange = 0
	if self:GetParent():IsRangedAttacker() then
		self.iAttackRange = 200
	end
	self.iMoveSpeed = 150
end

function modifier_player_chuyin:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end

function modifier_player_chuyin:GetModifierAttackRangeBonus()
	return self.iAttackRange
end

function modifier_player_chuyin:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
