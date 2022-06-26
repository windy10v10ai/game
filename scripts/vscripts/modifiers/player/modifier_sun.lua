modifier_sun = class({})

function modifier_sun:IsPurgable() return false end
function modifier_sun:RemoveOnDeath() return false end
function modifier_sun:GetTexture() return "player/plusIcon" end

function modifier_sun:OnCreated()
	self.iCooldownReduction = 25
end

function modifier_sun:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_sun:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
