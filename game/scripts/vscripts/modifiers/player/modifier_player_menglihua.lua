modifier_player_menglihua = class({})

function modifier_player_menglihua:IsPurgable() return false end
function modifier_player_menglihua:RemoveOnDeath() return false end
function modifier_player_menglihua:GetTexture() return "player/menglihua" end

function modifier_player_menglihua:OnCreated()
	self.iStatusResist = 40
	self.iCooldownReduction = 35
	self.iCastRange = 200
	self.iAttackRange = 0
	if self:GetParent():IsRangedAttacker() then
		self.iAttackRange = 200
	end
	self.iLifeSteal = 30
end

function modifier_player_menglihua:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end

function modifier_player_menglihua:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end

function modifier_player_menglihua:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_menglihua:GetModifierCastRangeBonusStacking()
	return self.iCastRange
end

function modifier_player_menglihua:GetModifierAttackRangeBonus()
	return self.iAttackRange
end

function modifier_player_menglihua:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end
