modifier_player_eygc = class({})

function modifier_player_eygc:IsPurgable() return false end
function modifier_player_eygc:RemoveOnDeath() return false end
function modifier_player_eygc:GetTexture() return "player/plusIcon" end

function modifier_player_eygc:OnCreated()
	self.iModelScale = -50
end
function modifier_player_eygc:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MODEL_SCALE,
	}
end

function modifier_player_eygc:GetModifierModelScale()
	return self.iModelScale
end
