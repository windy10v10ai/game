modifier_player_m5xw = class({})

function modifier_player_m5xw:IsPurgable() return false end
function modifier_player_m5xw:RemoveOnDeath() return false end
function modifier_player_m5xw:GetTexture() return "player/plusIcon" end

function modifier_player_m5xw:OnCreated()
	self.iCooldownReduction = 32
end

function modifier_player_m5xw:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_m5xw:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
