modifier_player_menglihua = class({})

function modifier_player_menglihua:IsPurgable() return false end
function modifier_player_menglihua:RemoveOnDeath() return false end
function modifier_player_menglihua:GetTexture() return "player/menglihua" end

function modifier_player_menglihua:OnCreated()
	self.iStatusResist = 40
end

function modifier_player_menglihua:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
	}
end

function modifier_player_menglihua:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end
