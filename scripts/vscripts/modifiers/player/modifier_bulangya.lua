modifier_bulangya = class({})

function modifier_bulangya:IsPurgable() return false end
function modifier_bulangya:RemoveOnDeath() return false end
function modifier_bulangya:GetTexture() return "player/bulangya" end

function modifier_bulangya:OnCreated()
	self.iLifeSteal = 15
end

function modifier_bulangya:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end

function modifier_bulangya:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end
