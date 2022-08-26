modifier_player_dky190 = class({})

function modifier_player_dky190:IsPurgable() return false end
function modifier_player_dky190:RemoveOnDeath() return false end
function modifier_player_dky190:GetTexture() return "player/plusIcon" end

function modifier_player_dky190:OnCreated()
	self.iModelScale = -50
end
function modifier_player_dky190:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MODEL_SCALE,
	}
end


function modifier_player_dky190:GetModifierModelScale()
	return self.iModelScale
end
