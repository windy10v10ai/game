modifier_player_mingri = class({})

function modifier_player_mingri:IsPurgable() return false end
function modifier_player_mingri:RemoveOnDeath() return false end
function modifier_player_mingri:GetTexture() return "player/plusIcon" end

function modifier_player_mingri:OnCreated()
	self.iCooldownReduction = 32
end

function modifier_player_mingri:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_mingri:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
