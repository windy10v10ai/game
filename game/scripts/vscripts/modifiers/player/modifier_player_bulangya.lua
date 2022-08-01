modifier_player_bulangya = class({})

function modifier_player_bulangya:IsPurgable() return false end
function modifier_player_bulangya:RemoveOnDeath() return false end
function modifier_player_bulangya:GetTexture() return "player/bulangya" end

function modifier_player_bulangya:OnCreated()
	self.iLifeSteal = 15
end

function modifier_player_bulangya:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end

function modifier_player_bulangya:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end
