modifier_artoria_mana_burst = class({})

function modifier_artoria_mana_burst:IsHidden()
	return true
end

function modifier_artoria_mana_burst:RemoveOnDeath()
	return true
end

function modifier_artoria_mana_burst:OnCreated(args)
	self.amp_pct = self:GetAbility():GetSpecialValueFor("amp_pct")
end

function modifier_artoria_mana_burst:OnRefresh(args)
	self.amp_pct = self:GetAbility():GetSpecialValueFor("amp_pct")
end

function modifier_artoria_mana_burst:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
	}
end

function modifier_artoria_mana_burst:GetModifierSpellAmplify_Percentage(params)
	return self.amp_pct
end
