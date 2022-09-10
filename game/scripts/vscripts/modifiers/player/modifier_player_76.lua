modifier_player_76 = class({})

function modifier_player_76:IsPurgable() return false end
function modifier_player_76:RemoveOnDeath() return false end
function modifier_player_76:GetTexture() return "player/76" end

function modifier_player_76:OnCreated()
	self.iMoveSpeed = 176
	self.Bonus_Mana_Regen_Total_Percentage = 1.76
	self.iCooldownReduction = 17.6
	self.iLifeSteal = 17.6
end
function modifier_player_76:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_MANA_REGEN_TOTAL_PERCENTAGE,
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
        MODIFIER_PROPERTY_MOVESPEED_LIMIT,
	}
end


function modifier_player_76:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_76:GetModifierTotalPercentageManaRegen()
	return self.Bonus_Mana_Regen_Total_Percentage
end

function modifier_player_76:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_76:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.iLifeSteal)
end

function modifier_player_76:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_player_76:GetModifierIgnoreMovespeedLimit()
    return 1
end
