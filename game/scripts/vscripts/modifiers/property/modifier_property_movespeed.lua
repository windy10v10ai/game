modifier_property_movespeed = class({})

function modifier_property_movespeed:IsPurgable() return false end
function modifier_property_movespeed:RemoveOnDeath() return false end
function modifier_property_movespeed:IsHidden() return true end

function modifier_property_movespeed:OnCreated(kv)
    if IsClient() then return end
	self.value = kv.value
    self:SetHasCustomTransmitterData(true)
end
function modifier_property_movespeed:AddCustomTransmitterData()
    return {
        value = self.value,
    }
end
function modifier_property_movespeed:HandleCustomTransmitterData( data )
    self.value = data.value
end

function modifier_property_movespeed:DeclareFunctions()
	return {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
	}
end

function modifier_property_movespeed:GetModifierMoveSpeedBonus_Constant()
	return self.value
end
