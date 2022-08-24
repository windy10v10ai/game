modifier_player_xianyu = class({})

function modifier_player_xianyu:IsPurgable() return false end
function modifier_player_xianyu:RemoveOnDeath() return false end
function modifier_player_xianyu:GetTexture() return "player/xianyu" end

function modifier_player_xianyu:OnCreated()
	self.iCooldownReduction = 40
	self.iStatusResist = 40
	self.iLifeSteal = 40
	self.iCastRange = 400
	self.iMoveSpeed = 100
end

function modifier_player_xianyu:CheckState()
	return {
		[MODIFIER_STATE_CANNOT_MISS] = true,
	}
end

function modifier_player_xianyu:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end


function modifier_player_xianyu:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_xianyu:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end

function modifier_player_xianyu:GetModifierCastRangeBonus()
	return self.iCastRange
end

function modifier_player_xianyu:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_xianyu:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
