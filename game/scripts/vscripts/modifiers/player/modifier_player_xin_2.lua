modifier_player_xin_2 = class({})

function modifier_player_xin_2:IsPurgable() return false end
function modifier_player_xin_2:RemoveOnDeath() return false end
function modifier_player_xin_2:GetTexture() return "player/xin_2" end

function modifier_player_xin_2:OnCreated()
	self.iCooldownReduction = 32
end


function modifier_player_xin_2:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_xin_2:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
