modifier_player_puck1609 = class({})

function modifier_player_puck1609:IsPurgable() return false end
function modifier_player_puck1609:RemoveOnDeath() return false end
function modifier_player_puck1609:GetTexture() return "player/puck1609" end

function modifier_player_puck1609:OnCreated()
	self.iCooldownReduction = 32
	self.iBonusDamage = 120
	self.agility = 80
	self.iMoveSpeed = 100
	self.iArmor = 40
end

function modifier_player_puck1609:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
        MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
	}
end

function modifier_player_puck1609:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_puck1609:GetModifierPreAttack_BonusDamage()
	return self.iBonusDamage
end

function modifier_player_puck1609:GetModifierBonusStats_Agility()
	return self.agility
end

function modifier_player_puck1609:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_puck1609:GetModifierPhysicalArmorBonus()
    return  self.iArmor
end
