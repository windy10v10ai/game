modifier_player_wonderpis = class({})

function modifier_player_wonderpis:IsPurgable() return false end
function modifier_player_wonderpis:RemoveOnDeath() return false end
function modifier_player_wonderpis:GetTexture() return "player/wonderpis" end

function modifier_player_wonderpis:OnCreated()
	self.iModelScale = -50
end
function modifier_player_wonderpis:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MODEL_SCALE,
	}
end


function modifier_player_wonderpis:GetModifierModelScale()
	return self.iModelScale
end
