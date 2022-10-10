modifier_property_cooldown = class({})

function modifier_property_cooldown:IsPurgable() return false end
function modifier_property_cooldown:RemoveOnDeath() return false end
function modifier_property_cooldown:IsHidden() return true end

function modifier_property_cooldown:OnCreated(kv)
    if IsClient() then return end
	self.value = kv.value
    self:SetHasCustomTransmitterData(true)
end
function modifier_property_cooldown:AddCustomTransmitterData()
    return {
        value = self.value,
    }
end
function modifier_property_cooldown:HandleCustomTransmitterData( data )
    self.value = data.value
end

function modifier_property_cooldown:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
	}
end

function modifier_property_cooldown:GetModifierPercentageCooldown()
	return self.value
end
