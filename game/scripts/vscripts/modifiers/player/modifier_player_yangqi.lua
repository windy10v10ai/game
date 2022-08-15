modifier_player_yangqi = class({})

function modifier_player_yangqi:IsPurgable() return false end
function modifier_player_yangqi:RemoveOnDeath() return false end
function modifier_player_yangqi:GetTexture() return "player/yangqi" end

function modifier_player_yangqi:OnCreated()
	self.iModelScale = -50
end
function modifier_player_yangqi:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MODEL_SCALE,
	}
end


function modifier_player_yangqi:GetModifierModelScale()
	return self.iModelScale
end
