modifier_player_laugh = class({})

function modifier_player_laugh:IsPurgable() return false end
function modifier_player_laugh:RemoveOnDeath() return false end
function modifier_player_laugh:GetTexture() return "player/plusIcon" end

function modifier_player_laugh:OnCreated()
	self.iLifeSteal = 15
end

function modifier_player_laugh:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end

function modifier_player_laugh:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end
