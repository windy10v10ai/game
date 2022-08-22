modifier_player_lani = class({})

function modifier_player_lani:IsPurgable() return false end
function modifier_player_lani:RemoveOnDeath() return false end
function modifier_player_lani:GetTexture() return "player/plusIcon" end

function modifier_player_lani:OnCreated()
	self.iCooldownReduction = 32
end

function modifier_player_lani:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_lani:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
