modifier_player_qiannian = class({})

function modifier_player_qiannian:IsPurgable() return false end
function modifier_player_qiannian:RemoveOnDeath() return false end
function modifier_player_qiannian:GetTexture() return "player/qiannian" end

function modifier_player_qiannian:OnCreated()
	self.iModelScale = -50
end

function modifier_player_qiannian:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MODEL_SCALE,
	}
end

function modifier_player_qiannian:GetModifierModelScale()
	return self.iModelScale
end
