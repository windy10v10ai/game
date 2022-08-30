modifier_player_arrayzoneyour = class({})

function modifier_player_arrayzoneyour:IsPurgable() return false end
function modifier_player_arrayzoneyour:RemoveOnDeath() return false end
function modifier_player_arrayzoneyour:GetTexture() return "player/plusIcon" end

function modifier_player_arrayzoneyour:OnCreated()
	self.iCooldownReduction = 32
	self.iSpellAmplify = 40
end

function modifier_player_arrayzoneyour:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_player_arrayzoneyour:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_arrayzoneyour:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end
