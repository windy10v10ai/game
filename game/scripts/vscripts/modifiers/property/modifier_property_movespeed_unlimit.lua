modifier_property_movespeed_unlimit = class({})

function modifier_property_movespeed_unlimit:IsPurgable() return false end
function modifier_property_movespeed_unlimit:RemoveOnDeath() return false end
function modifier_property_movespeed_unlimit:IsHidden() return true end

function modifier_property_movespeed_unlimit:OnCreated(kv)
end

function modifier_property_movespeed_unlimit:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT,
		MODIFIER_PROPERTY_MOVESPEED_LIMIT,
	}
end


function modifier_property_movespeed_unlimit:GetModifierMoveSpeed_Limit()
    return 5000
end

function modifier_property_movespeed_unlimit:GetModifierIgnoreMovespeedLimit()
    return 1
end
