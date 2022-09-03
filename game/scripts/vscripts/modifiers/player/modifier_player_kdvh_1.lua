modifier_player_kdvh_1 = class({})

function modifier_player_kdvh_1:IsPurgable() return false end
function modifier_player_kdvh_1:RemoveOnDeath() return false end
function modifier_player_kdvh_1:GetTexture() return "player/kdvh_1" end

function modifier_player_kdvh_1:OnCreated()
	self.iCooldownReduction = 8
	self.iMoveSpeed = 50
	self.iLifeSteal = 15
end

function modifier_player_kdvh_1:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end

function modifier_player_kdvh_1:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_kdvh_1:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_kdvh_1:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end
