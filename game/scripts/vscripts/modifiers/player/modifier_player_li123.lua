modifier_player_li123 = class({})

function modifier_player_li123:IsPurgable() return false end
function modifier_player_li123:RemoveOnDeath() return false end
function modifier_player_li123:GetTexture() return "player/plusIcon" end

function modifier_player_li123:OnCreated()
	self.iLifeSteal = 15
	self.iMoveSpeed = 50
end

function modifier_player_li123:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_ATTACK_LANDED,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end

function modifier_player_li123:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_li123:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
