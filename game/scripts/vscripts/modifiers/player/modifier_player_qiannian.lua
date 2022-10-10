modifier_player_qiannian = class({})

function modifier_player_qiannian:IsPurgable() return false end
function modifier_player_qiannian:RemoveOnDeath() return false end
function modifier_player_qiannian:GetTexture() return "player/qiannian" end

function modifier_player_qiannian:OnCreated()
	self.iCooldownReduction = 35
	self.iStatusResist = 32
	self.iLifeSteal = 60
	self.iSpellAmplify = 40

	local primaryAttributeBouns = 60
	self.strength = 80
	self.agility = 80
	self.intellect = 80
	self.iModelScale = -50
	self.iMoveSpeed = 200
	self.iArmor = 40
	self.iHealthRegen = 2.0
	self.iAttackRange = 200
	-- get parent's primary attribute
	if IsClient() then return end
	local primaryAttribute = self:GetParent():GetPrimaryAttribute()
	if primaryAttribute == 0 then
		self.strength = self.strength + primaryAttributeBouns
	elseif primaryAttribute == 1 then
		self.agility = self.agility + primaryAttributeBouns
	elseif primaryAttribute == 2 then
		self.intellect = self.intellect + primaryAttributeBouns
	end
end

function modifier_player_qiannian:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
		MODIFIER_PROPERTY_MODEL_SCALE,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
		MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE,
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS,
	}
end

function modifier_player_qiannian:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_qiannian:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end

function modifier_player_qiannian:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_qiannian:GetModifierBonusStats_Strength()
	return self.strength
end

function modifier_player_qiannian:GetModifierBonusStats_Agility()
	return self.agility
end

function modifier_player_qiannian:GetModifierBonusStats_Intellect()
	return self.intellect
end

function modifier_player_qiannian:GetModifierModelScale()
	return self.iModelScale
end

function modifier_player_qiannian:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_qiannian:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_qiannian:GetModifierIgnoreMovespeedLimit()
    return 1
end

function modifier_player_qiannian:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end

function modifier_player_qiannian:GetModifierPhysicalArmorBonus()
    return self.iArmor
end

function modifier_player_qiannian:GetModifierHealthRegenPercentage()
	return self.iHealthRegen
end

function modifier_player_qiannian:GetModifierAttackRangeBonus()
	if self:GetParent():IsRangedAttacker() then
		return self.iAttackRange
	end
	return 0
end
