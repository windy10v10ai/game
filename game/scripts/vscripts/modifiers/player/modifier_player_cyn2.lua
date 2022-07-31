modifier_player_cyn2 = class({})

function modifier_player_cyn2:IsPurgable() return false end
function modifier_player_cyn2:RemoveOnDeath() return false end
function modifier_player_cyn2:GetTexture() return "player/cyn2" end

function modifier_player_cyn2:OnCreated()
	self.iCooldownReduction = 10
end

function modifier_player_cyn2:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_cyn2:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
