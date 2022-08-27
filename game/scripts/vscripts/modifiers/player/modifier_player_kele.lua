modifier_player_kele = class({})

function modifier_player_kele:IsPurgable() return false end
function modifier_player_kele:RemoveOnDeath() return false end
function modifier_player_kele:GetTexture() return "player/kele" end

function modifier_player_kele:OnCreated()
	self.iCooldownReduction = 8
end

function modifier_player_kele:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_kele:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
