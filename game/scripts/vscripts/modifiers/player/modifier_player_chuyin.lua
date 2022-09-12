modifier_player_chuyin = class({})

function modifier_player_chuyin:IsPurgable() return false end
function modifier_player_chuyin:RemoveOnDeath() return false end
function modifier_player_chuyin:GetTexture() return "player/chuyin" end

function modifier_player_chuyin:OnCreated()
	self.iAttackRange = 0
	if self:GetParent():IsRangedAttacker() then
		self.iAttackRange = 200
	end
	self.iMoveSpeed = 150
	self.iLifeSteal = 15
	self.iCooldownReduction = 32
	self.iSpellAmplify = 40
	self.iCastRange = 200
end

function modifier_player_chuyin:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
	}
end

function modifier_player_chuyin:GetModifierAttackRangeBonus()
	return self.iAttackRange
end

function modifier_player_chuyin:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_chuyin:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_chuyin:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_chuyin:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end

function modifier_player_chuyin:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_chuyin:GetModifierIgnoreMovespeedLimit()
    return 1
end

function modifier_player_chuyin:GetModifierCastRangeBonusStacking()
	return self.iCastRange
end
