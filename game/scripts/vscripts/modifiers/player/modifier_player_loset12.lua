modifier_player_loset12 = class({})

function modifier_player_loset12:IsPurgable() return false end
function modifier_player_loset12:RemoveOnDeath() return false end
function modifier_player_loset12:GetTexture() return "player/loset12" end

function modifier_player_loset12:OnCreated()
	self.iCooldownReduction = 16
end

function modifier_player_loset12:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_loset12:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
