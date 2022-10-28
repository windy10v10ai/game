modifier_property_life_steal = class({})

function modifier_property_life_steal:IsPurgable() return false end
function modifier_property_life_steal:RemoveOnDeath() return false end
function modifier_property_life_steal:IsHidden() return true end

function modifier_property_life_steal:OnCreated(kv)
    if IsClient() then return end
	self.value = kv.value
    self:SetHasCustomTransmitterData(true)
end

function modifier_property_life_steal:AddCustomTransmitterData()
    return {
        value = self.value,
    }
end

function modifier_property_life_steal:HandleCustomTransmitterData( data )
    self.value = data.value
end

function modifier_property_life_steal:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
end

function modifier_property_life_steal:OnAttackLanded(params)
	LifeStealOnAttackLanded(params, self.value, self:GetParent(), self:GetAbility())
end
