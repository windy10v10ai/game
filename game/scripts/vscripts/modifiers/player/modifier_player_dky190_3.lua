modifier_player_dky190_3 = class({})

function modifier_player_dky190_3:IsPurgable() return false end
function modifier_player_dky190_3:RemoveOnDeath() return false end
function modifier_player_dky190_3:GetTexture() return "player/dky190_3" end

function modifier_player_dky190_3:OnCreated()
	self.strength = 50
	self.agility = 50
	self.intellect = 50
	self.iCooldownReduction = 32
	self.iLifeSteal = 25
	self.iAttackSpeed = 20
	self.iArmor = 10
end
function modifier_player_dky190_3:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
	}
end

function modifier_player_dky190_3:GetModifierBonusStats_Strength()
	return self.strength
end

function modifier_player_dky190_3:GetModifierBonusStats_Agility()
	return self.agility
end

function modifier_player_dky190_3:GetModifierBonusStats_Intellect()
	return self.intellect
end

function modifier_player_dky190_3:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_dky190_3:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal, self:GetParent(), self:GetAbility())
end

function modifier_player_dky190_3:GetModifierAttackSpeedBonus_Constant()
	return self.iAttackSpeed
end

function modifier_player_dky190_3:GetModifierPhysicalArmorBonus()
    return self.iArmor
end
