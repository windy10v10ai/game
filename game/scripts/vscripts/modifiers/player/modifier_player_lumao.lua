modifier_player_lumao = class({})

function modifier_player_lumao:IsPurgable() return false end
function modifier_player_lumao:RemoveOnDeath() return false end
function modifier_player_lumao:GetTexture() return "player/lumao" end

function modifier_player_lumao:OnCreated()
	self.iCooldownReduction = 40
	self.iStatusResist = 40
	self.iLifeSteal = 40
	self.iCastRange = 400
	self.iMoveSpeed = 200
end

function modifier_player_lumao:CheckState()
	return {
		[MODIFIER_STATE_CANNOT_MISS] = true,
	}
end

function modifier_player_lumao:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
	}
end


function modifier_player_lumao:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_lumao:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end

function modifier_player_lumao:GetModifierCastRangeBonus()
	return self.iCastRange
end

function modifier_player_lumao:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_lumao:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_lumao:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_lumao:GetModifierIgnoreMovespeedLimit()
    return 1
end
