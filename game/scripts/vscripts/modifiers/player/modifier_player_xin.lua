modifier_player_xin = class({})

function modifier_player_xin:IsPurgable() return false end
function modifier_player_xin:RemoveOnDeath() return false end
function modifier_player_xin:GetTexture() return "player/xin" end

function modifier_player_xin:OnCreated()
	self.iModelScale = 50
end


function modifier_player_xin:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MODEL_SCALE,
	}
end

function modifier_player_xin:GetModifierModelScale()
	return self.iModelScale
end
