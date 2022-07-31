modifier_player_cyn3 = class({})

function modifier_player_cyn3:IsPurgable() return false end
function modifier_player_cyn3:RemoveOnDeath() return false end
function modifier_player_cyn3:GetTexture() return "player/cyn3" end

function modifier_player_cyn3:OnCreated()
	self.iCooldownReduction = 20
end

function modifier_player_cyn3:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_cyn3:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
