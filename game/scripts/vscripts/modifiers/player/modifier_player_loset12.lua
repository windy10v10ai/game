modifier_player_loset12 = class({})

function modifier_player_loset12:IsPurgable() return false end
function modifier_player_loset12:RemoveOnDeath() return false end
function modifier_player_loset12:GetTexture() return "player/plusIcon" end

function modifier_player_loset12:OnCreated()
	self.iCooldownReduction = 16
	self.iSpellAmplify = 20
end

function modifier_player_loset12:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_player_loset12:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_loset12:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end
