modifier_player_jiangcai = class({})

function modifier_player_jiangcai:IsPurgable() return false end
function modifier_player_jiangcai:RemoveOnDeath() return false end
function modifier_player_jiangcai:GetTexture() return "player/plusIcon" end

function modifier_player_jiangcai:OnCreated()
	self.iCooldownReduction = 10
end

function modifier_player_jiangcai:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_jiangcai:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
