modifier_dalaogongji = class({})

function modifier_dalaogongji:IsPurgable() return false end
function modifier_dalaogongji:RemoveOnDeath() return false end
function modifier_dalaogongji:GetTexture() return "player/dalaogongji" end

function modifier_dalaogongji:OnCreated()
	self.iCooldownReduction = 35
end

function modifier_dalaogongji:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_dalaogongji:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
