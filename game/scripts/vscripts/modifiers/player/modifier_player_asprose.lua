modifier_player_asprose = class({})

function modifier_player_asprose:IsPurgable() return false end
function modifier_player_asprose:RemoveOnDeath() return false end
function modifier_player_asprose:GetTexture() return "player/asprose" end

function modifier_player_asprose:OnCreated()
	self.iModelScale = -50
end
function modifier_player_asprose:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MODEL_SCALE,
	}
end

function modifier_player_asprose:GetModifierModelScale()
	return self.iModelScale
end
