modifier_player_puck1609 = class({})

function modifier_player_puck1609:IsPurgable() return false end
function modifier_player_puck1609:RemoveOnDeath() return false end
function modifier_player_puck1609:GetTexture() return "player/puck1609" end

function modifier_player_puck1609:OnCreated()
	self.iCooldownReduction = 32
end

function modifier_player_puck1609:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_puck1609:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
