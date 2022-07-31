modifier_player_pns = class({})

function modifier_player_pns:IsPurgable() return false end
function modifier_player_pns:RemoveOnDeath() return false end
function modifier_player_pns:GetTexture() return "player/plusIcon" end

function modifier_player_pns:OnCreated()
	self.iLifeSteal = 15
end

function modifier_player_pns:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end

function modifier_player_pns:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end
