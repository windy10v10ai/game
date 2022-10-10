modifier_property_primary_attribute = class({})

function modifier_property_primary_attribute:IsPurgable() return false end
function modifier_property_primary_attribute:RemoveOnDeath() return false end
function modifier_property_primary_attribute:IsHidden() return true end

function modifier_property_primary_attribute:OnCreated(kv)
    if IsClient() then return end
    local primaryAttributeBouns = kv.value
	self.strength = 0
	self.agility = 0
	self.intellect = 0
	local primaryAttribute = self:GetParent():GetPrimaryAttribute()
	if primaryAttribute == 0 then
		self.strength = self.strength + primaryAttributeBouns
	elseif primaryAttribute == 1 then
		self.agility = self.agility + primaryAttributeBouns
	elseif primaryAttribute == 2 then
		self.intellect = self.intellect + primaryAttributeBouns
	end
    self:SetHasCustomTransmitterData(true)
end
function modifier_property_primary_attribute:AddCustomTransmitterData()
    return {
        strength = self.strength,
        agility = self.agility,
        intellect = self.intellect,
    }
end
function modifier_property_primary_attribute:HandleCustomTransmitterData( data )
    self.strength = data.strength
    self.agility = data.agility
    self.intellect = data.intellect
end
function modifier_property_primary_attribute:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
	}
end

function modifier_property_primary_attribute:GetModifierBonusStats_Strength()
	return self.strength
end

function modifier_property_primary_attribute:GetModifierBonusStats_Agility()
	return self.agility
end

function modifier_property_primary_attribute:GetModifierBonusStats_Intellect()
	return self.intellect
end
