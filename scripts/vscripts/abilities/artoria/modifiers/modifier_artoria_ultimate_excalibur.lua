modifier_artoria_ultimate_excalibur = class({})

function modifier_artoria_ultimate_excalibur:CheckState()
	local state = {
		[MODIFIER_STATE_STUNNED] = true,
		[MODIFIER_STATE_INVISIBLE] = false,
	}

	return state
end

function modifier_artoria_ultimate_excalibur:RemoveOnDeath()
	return true
end

function modifier_artoria_ultimate_excalibur:IsHidden()
	return true
end