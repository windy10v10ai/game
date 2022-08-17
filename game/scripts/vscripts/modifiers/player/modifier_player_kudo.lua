modifier_player_kudo = class({})

function modifier_player_kudo:IsPurgable() return false end
function modifier_player_kudo:RemoveOnDeath() return false end
function modifier_player_kudo:GetTexture() return "player/plusIcon" end

function modifier_player_kudo:OnCreated()
	self.iCooldownReduction = 10
end

function modifier_player_kudo:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_kudo:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
