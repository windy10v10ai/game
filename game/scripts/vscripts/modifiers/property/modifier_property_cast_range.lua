modifier_property_cast_range = class({})

function modifier_property_cast_range:IsPurgable() return false end
function modifier_property_cast_range:RemoveOnDeath() return false end
function modifier_property_cast_range:IsHidden() return true end

function modifier_property_cast_range:OnCreated(kv)
    if IsClient() then return end
	self.value = kv.value
    self:SetHasCustomTransmitterData(true)
end
function modifier_property_cast_range:AddCustomTransmitterData()
    return {
        value = self.value,
    }
end
function modifier_property_cast_range:HandleCustomTransmitterData( data )
    self.value = data.value
end

function modifier_property_cast_range:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
	}
end

function modifier_property_cast_range:GetModifierCastRangeBonusStacking()
	return self.value
end
