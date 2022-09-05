modifier_player_76 = class({})

function modifier_player_76:IsPurgable() return false end
function modifier_player_76:RemoveOnDeath() return false end
function modifier_player_76:GetTexture() return "player/76" end

function modifier_player_76:OnCreated()
	self.iMoveSpeed = 76
	self.Bonus_Mana_Regen_Total_Percentage = 7.6
	self.iItemCooldownReduction = 100
end
function modifier_player_76:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_MANA_REGEN_TOTAL_PERCENTAGE,
		MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
		MODIFIER_PROPERTY_ITEM_COOLDOWN_REDUCTION,
	}
end


function modifier_player_76:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end

function modifier_player_76:GetModifierTotalPercentageManaRegen()
	return self.Bonus_Mana_Regen_Total_Percentage
end

function modifier_player_76:GetModifierIgnoreMovespeedLimit()
	return 1
end

function modifier_player_76:GetModifierReductionCooldownItem()
	return self.iItemCooldownReduction
end
