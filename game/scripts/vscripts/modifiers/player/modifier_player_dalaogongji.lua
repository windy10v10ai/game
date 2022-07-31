modifier_player_dalaogongji = class({})

function modifier_player_dalaogongji:IsPurgable() return false end
function modifier_player_dalaogongji:RemoveOnDeath() return false end
function modifier_player_dalaogongji:GetTexture() return "player/dalaogongji" end

function modifier_player_dalaogongji:OnCreated()
	self.iCooldownReduction = 35
end

function modifier_player_dalaogongji:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_dalaogongji:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
