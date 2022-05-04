modifier_hunzhuo = class({})

function modifier_hunzhuo:IsPurgable() return false end
function modifier_hunzhuo:RemoveOnDeath() return false end
function modifier_hunzhuo:GetTexture() return "player/hunzhuo" end

function modifier_hunzhuo:OnCreated()
	self.iCooldownReduction = 15
	self.iLifeSteal = 25
end
function modifier_hunzhuo:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end

function modifier_hunzhuo:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_hunzhuo:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end
