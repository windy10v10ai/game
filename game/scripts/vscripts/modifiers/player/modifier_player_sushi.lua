modifier_player_sushi = class({})

function modifier_player_sushi:IsPurgable() return false end
function modifier_player_sushi:RemoveOnDeath() return false end
function modifier_player_sushi:GetTexture() return "player/sushi" end

function modifier_player_sushi:OnCreated()
	self.iSpellAmplify = 10
	self.iAttackSpeed = 30
	self.iLifeSteal = 15
	self.iCooldownReduction = 8
end

function modifier_player_sushi:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_sushi:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end

function modifier_player_sushi:GetModifierAttackSpeedBonus_Constant()
	return self.iAttackSpeed
end

function modifier_player_sushi:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_sushi:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
