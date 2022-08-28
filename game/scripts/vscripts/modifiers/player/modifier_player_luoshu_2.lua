modifier_player_luoshu_2 = class({})

function modifier_player_luoshu_2:IsPurgable() return false end
function modifier_player_luoshu_2:RemoveOnDeath() return false end
function modifier_player_luoshu_2:GetTexture() return "player/luoshu_2" end

function modifier_player_luoshu_2:OnCreated()
	self.iModelScale = 50
end
function modifier_player_luoshu_2:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MODEL_SCALE,
	}
end


function modifier_player_luoshu_2:GetModifierModelScale()
	return self.iModelScale
end
