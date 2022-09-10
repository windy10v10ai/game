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
	}
end


function modifier_player_76:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
