modifier_player_xibaibai = class({})

function modifier_player_xibaibai:IsPurgable() return false end
function modifier_player_xibaibai:RemoveOnDeath() return false end
function modifier_player_xibaibai:GetTexture() return "player/xibaibai" end

function modifier_player_xibaibai:OnCreated()
	self.iCooldownReduction = 8
end

function modifier_player_xibaibai:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_xibaibai:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
