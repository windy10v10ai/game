modifier_xin = class({})

function modifier_xin:IsPurgable() return false end
function modifier_xin:RemoveOnDeath() return false end
function modifier_xin:GetTexture() return "player/xin" end

function modifier_xin:OnCreated()
	self.iStrength = 20
end
function modifier_xin:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
	}
end

function modifier_xin:GetModifierBonusStats_Strength()
	return self.iStrength
end
