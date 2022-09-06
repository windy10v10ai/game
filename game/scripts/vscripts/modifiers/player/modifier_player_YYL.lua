modifier_player_YYL = class({})

function modifier_player_YYL:IsPurgable() return false end
function modifier_player_YYL:RemoveOnDeath() return false end
function modifier_player_YYL:GetTexture() return "player/YYL" end

function modifier_player_YYL:OnCreated()
	self.iCooldownReduction = 20
	self.iCastRange = 200
	self.iSpellAmplify = 20

end

function modifier_player_YYL:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,

	}
end

function modifier_player_YYL:GetModifierPercentageCooldown()
	return self.iCooldownReduction
end

function modifier_player_YYL:GetModifierCastRangeBonusStacking()
	return self.iCastRange
end

function modifier_player_YYL:GetModifierSpellAmplify_Percentage()
	return self.iSpellAmplify
end

