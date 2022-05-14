modifier_dabuguo = class({})

function modifier_dabuguo:IsPurgable() return false end
function modifier_dabuguo:RemoveOnDeath() return false end
function modifier_dabuguo:GetTexture() return "player/dabuguo" end

function modifier_dabuguo:OnCreated()
	self.iCooldownReduction = 35
end

function modifier_dabuguo:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_dabuguo:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
