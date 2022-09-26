modifier_player_xys = class({})

function modifier_player_xys:IsPurgable() return false end
function modifier_player_xys:RemoveOnDeath() return false end
function modifier_player_xys:GetTexture() return "player/plusIcon" end

function modifier_player_xys:OnCreated()
	self.iCooldownReduction = 32
end

function modifier_player_xys:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_xys:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
