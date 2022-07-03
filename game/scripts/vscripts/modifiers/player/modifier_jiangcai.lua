modifier_jiangcai = class({})

function modifier_jiangcai:IsPurgable() return false end
function modifier_jiangcai:RemoveOnDeath() return false end
function modifier_jiangcai:GetTexture() return "player/plusIcon" end

function modifier_jiangcai:OnCreated()
	self.iCooldownReduction = 10
end

function modifier_jiangcai:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_jiangcai:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end
