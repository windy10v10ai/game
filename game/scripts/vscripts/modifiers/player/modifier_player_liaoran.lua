modifier_player_liaoran = class({})

function modifier_player_liaoran:IsPurgable() return false end
function modifier_player_liaoran:RemoveOnDeath() return false end
function modifier_player_liaoran:GetTexture() return "player/liaoran" end

function modifier_player_liaoran:OnCreated()
	self.iCooldownReduction = 8
	self.iMoveSpeed = 50
end

function modifier_player_liaoran:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end

function modifier_player_liaoran:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_liaoran:GetModifierMoveSpeedBonus_Constant()
	return self.iMoveSpeed
end
