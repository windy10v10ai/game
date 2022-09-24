modifier_player_weilan = class({})

function modifier_player_weilan:IsPurgable() return false end
function modifier_player_weilan:RemoveOnDeath() return false end
function modifier_player_weilan:GetTexture() return "player/plusIcon" end

function modifier_player_weilan:OnCreated()
	self.iMoveSpeed = 200
	self.iLifeSteal = 30
end

function modifier_player_weilan:DeclareFunctions()
	return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end

function modifier_player_weilan:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_weilan:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_weilan:GetModifierIgnoreMovespeedLimit()
    return 1
end

function modifier_player_weilan:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end
