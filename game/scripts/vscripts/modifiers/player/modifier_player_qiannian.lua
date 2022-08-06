modifier_player_qiannian = class({})

function modifier_player_qiannian:IsPurgable() return false end
function modifier_player_qiannian:RemoveOnDeath() return false end
function modifier_player_qiannian:GetTexture() return "player/plusIcon" end

function modifier_player_qiannian:OnCreated()
	self.iCooldownReduction = 35
	self.iStatusResist = 32
	self.iLifeSteal = 60

	local primaryAttributeBouns = 60
	self.strength = 0
	self.agility = 0
	self.intellect = 0
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
