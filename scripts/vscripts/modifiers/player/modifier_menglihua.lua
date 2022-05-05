modifier_menglihua = class({})

function modifier_menglihua:IsPurgable() return false end
function modifier_menglihua:RemoveOnDeath() return false end
function modifier_menglihua:GetTexture() return "player/menglihua" end

function modifier_menglihua:OnCreated()
	self.iStatusResist = 40
end

function modifier_menglihua:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
	}
end

function modifier_menglihua:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end
