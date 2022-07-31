modifier_player_hunzhuo = class({})

function modifier_player_hunzhuo:IsPurgable() return false end
function modifier_player_hunzhuo:RemoveOnDeath() return false end
function modifier_player_hunzhuo:GetTexture() return "player/hunzhuo" end

function modifier_player_hunzhuo:OnCreated()
	self.iCooldownReduction = 15
	self.iMoveSpeed = 80
	self.iLifeSteal = 25
end
function modifier_player_hunzhuo:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end

function modifier_player_hunzhuo:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_hunzhuo:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_hunzhuo:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end
