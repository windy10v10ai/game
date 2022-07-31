modifier_player_sun = class({})

function modifier_player_sun:IsPurgable() return false end
function modifier_player_sun:RemoveOnDeath() return false end
function modifier_player_sun:GetTexture() return "player/sun" end

function modifier_player_sun:OnCreated()
	self.iCooldownReduction = 25
end

function modifier_player_sun:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_sun:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
