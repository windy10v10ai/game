modifier_j3e9 = class({})

function modifier_j3e9:IsPurgable() return false end
function modifier_j3e9:RemoveOnDeath() return false end
function modifier_j3e9:GetTexture() return "player/plusIcon" end

function modifier_j3e9:OnCreated()
	self.iCooldownReduction = 35
end

function modifier_j3e9:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_j3e9:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
