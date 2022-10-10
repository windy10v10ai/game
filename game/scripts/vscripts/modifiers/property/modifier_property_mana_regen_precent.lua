modifier_property_mana_regen_precent = class({})

function modifier_property_mana_regen_precent:IsPurgable() return false end
function modifier_property_mana_regen_precent:RemoveOnDeath() return false end
function modifier_property_mana_regen_precent:IsHidden() return true end

function modifier_property_mana_regen_precent:OnCreated(kv)
    if IsClient() then return end
	self.value = kv.value
    self:SetHasCustomTransmitterData(true)
end
function modifier_property_mana_regen_precent:AddCustomTransmitterData()
    return {
        value = self.value,
    }
end
function modifier_property_mana_regen_precent:HandleCustomTransmitterData( data )
    self.value = data.value
end

function modifier_property_mana_regen_precent:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MANA_REGEN_TOTAL_PERCENTAGE,
	}
end

function modifier_property_mana_regen_precent:GetModifierTotalPercentageManaRegen()
	return self.value
end
