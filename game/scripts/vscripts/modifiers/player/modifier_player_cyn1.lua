modifier_player_cyn1 = class({})

function modifier_player_cyn1:IsPurgable() return false end
function modifier_player_cyn1:RemoveOnDeath() return false end
function modifier_player_cyn1:GetTexture() return "player/cyn1" end

function modifier_player_cyn1:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,
	}
end

function modifier_player_cyn1:GetPriority()
	return MODIFIER_PRIORITY_SUPER_ULTRA
end

function modifier_player_cyn1:GetModifierBaseAttackTimeConstant()
    return 1
end
