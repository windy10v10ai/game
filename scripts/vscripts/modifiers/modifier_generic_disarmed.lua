modifier_generic_disarmed = class({})

--------------------------------------------------------------------------------

function modifier_generic_disarmed:IsDebuff()
	return true
end

function modifier_generic_disarmed:IsStunDebuff()
	return false
end

--------------------------------------------------------------------------------

function modifier_generic_disarmed:CheckState()
	local state = {
	[MODIFIER_STATE_DISARMED] = true,
	}

	return state
end

--------------------------------------------------------------------------------

function modifier_generic_disarmed:DeclareFunctions()
	local funcs = {
		MODIFIER_PROPERTY_OVERRIDE_ANIMATION,
	}

	return funcs
end

function modifier_generic_disarmed:GetOverrideAnimation( params )
	return ACT_DOTA_DISABLED
end

--------------------------------------------------------------------------------

function modifier_generic_disarmed:GetEffectName()
	return "particles/generic_gameplay/generic_stunned.vpcf"
end

function modifier_generic_disarmed:GetEffectAttachType()
	return PATTACH_OVERHEAD_FOLLOW
end