modifier_player_laugh = class({})

function modifier_player_laugh:IsPurgable() return false end
function modifier_player_laugh:RemoveOnDeath() return false end
function modifier_player_laugh:GetTexture() return "player/plusIcon" end

function modifier_player_laugh:OnCreated()
	self.iLifeSteal = 15
	self.iCooldownReduction = 32
	self.iMoveSpeed = 200
end

function modifier_player_laugh:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
	}
end

function modifier_player_laugh:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_laugh:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_laugh:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_laugh:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_laugh:GetModifierIgnoreMovespeedLimit()
    return 1
end
