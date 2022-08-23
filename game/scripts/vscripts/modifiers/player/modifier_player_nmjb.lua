modifier_player_nmjb = class({})

function modifier_player_nmjb:IsPurgable() return false end
function modifier_player_nmjb:RemoveOnDeath() return false end
function modifier_player_nmjb:GetTexture() return "player/plusIcon" end

function modifier_player_nmjb:OnCreated()
	self.iBonusDamage = 30
	self.iCooldownReduction = 24
	self.iMoveSpeed = 100
end

function modifier_player_nmjb:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end

function modifier_player_nmjb:GetModifierPreAttack_BonusDamage()
	return self.iBonusDamage
end

function modifier_player_nmjb:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_nmjb:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
