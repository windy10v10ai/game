modifier_player_chashaobao = class({})

function modifier_player_chashaobao:IsPurgable() return false end
function modifier_player_chashaobao:RemoveOnDeath() return false end
function modifier_player_chashaobao:GetTexture() return "player/chashaobao" end

function modifier_player_chashaobao:OnCreated()
	self.iHealthRegen = 1.0
	self.iIncomingDamage = -8
	self.iStatusResist = 8
end


function modifier_player_chashaobao:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE_UNIQUE,
		MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
	}
end


function modifier_player_chashaobao:GetModifierHealthRegenPercentageUnique()
	return self.iHealthRegen
end

function modifier_player_chashaobao:GetModifierIncomingDamage_Percentage()
	return self.iIncomingDamage
end

function modifier_player_chashaobao:GetModifierStatusResistanceStacking()
	return self.iStatusResist
end
