modifier_player_dabuguo = class({})

function modifier_player_dabuguo:IsPurgable() return false end
function modifier_player_dabuguo:RemoveOnDeath() return false end
function modifier_player_dabuguo:GetTexture() return "player/dabuguo" end

function modifier_player_dabuguo:OnCreated()
	self.iCooldownReduction = 35
	self.iAttackSpeed = 120
	self.iLifeSteal = 60
	self.iMoveSpeed = 200
end

function modifier_player_dabuguo:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
	}
end

function modifier_player_dabuguo:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_dabuguo:GetModifierAttackSpeedBonus_Constant()
	return self.iAttackSpeed
end

function modifier_player_dabuguo:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_dabuguo:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_dabuguo:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_dabuguo:GetModifierIgnoreMovespeedLimit()
    return 1
end
