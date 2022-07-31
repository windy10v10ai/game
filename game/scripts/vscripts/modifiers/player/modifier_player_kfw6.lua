modifier_player_kfw6 = class({})

function modifier_player_kfw6:IsPurgable() return false end
function modifier_player_kfw6:RemoveOnDeath() return false end
function modifier_player_kfw6:GetTexture() return "player/plusIcon" end

function modifier_player_kfw6:OnCreated()
	self.iCooldownReduction = 10
end

function modifier_player_kfw6:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_kfw6:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
