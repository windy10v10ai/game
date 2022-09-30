modifier_property_status_resist = class({})

function modifier_property_status_resist:IsPurgable() return false end
function modifier_property_status_resist:RemoveOnDeath() return false end
function modifier_property_status_resist:IsHidden() return true end

function modifier_property_status_resist:OnCreated(kv)
    if IsClient() then return end
	self.value = kv.value
    self:SetHasCustomTransmitterData(true)
end
function modifier_property_status_resist:AddCustomTransmitterData()
    return {
        value = self.value,
    }
end
function modifier_property_status_resist:HandleCustomTransmitterData( data )
    self.value = data.value
end

function modifier_property_status_resist:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
	}
end

function modifier_property_status_resist:GetModifierStatusResistanceStacking()
	return self.value
end
