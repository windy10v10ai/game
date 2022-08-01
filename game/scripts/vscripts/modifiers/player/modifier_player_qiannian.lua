modifier_player_qiannian = class({})

function modifier_player_qiannian:IsPurgable() return false end
function modifier_player_qiannian:RemoveOnDeath() return false end
function modifier_player_qiannian:GetTexture() return "player/plusIcon" end

function modifier_player_qiannian:OnCreated()
	self.iCooldownReduction = 35
end

function modifier_player_qiannian:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_player_qiannian:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
