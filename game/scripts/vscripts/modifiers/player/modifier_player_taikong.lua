modifier_player_taikong = class({})

function modifier_player_taikong:IsPurgable() return false end
function modifier_player_taikong:RemoveOnDeath() return false end
function modifier_player_taikong:GetTexture() return "player/taikong" end

function modifier_player_taikong:OnCreated()
	self.iCooldownReduction = 10
end

function modifier_player_taikong:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_taikong:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
