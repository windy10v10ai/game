modifier_player_j3e9 = class({})

function modifier_player_j3e9:IsPurgable() return false end
function modifier_player_j3e9:RemoveOnDeath() return false end
function modifier_player_j3e9:GetTexture() return "player/plusIcon" end

function modifier_player_j3e9:OnCreated()
	self.iCooldownReduction = 35
	self.iLifeSteal = 15
	self.iBonusDamage = 60
end

function modifier_player_j3e9:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
	}
end

function modifier_player_j3e9:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_j3e9:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_j3e9:GetModifierPreAttack_BonusDamage()
	return self.iBonusDamage
end
