modifier_artoria_excalibur_debuff = class({})


function modifier_artoria_excalibur_debuff:DeclareFunctions()
    return
    {
        MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,           --移速百分比
   }
end

function modifier_artoria_excalibur_debuff:RemoveOnDeath()
	return true
end

function modifier_artoria_excalibur_debuff:IsHidden()
	return true
end

function modifier_artoria_excalibur_debuff:IsPurgable()
	return true
end

function modifier_artoria_excalibur_debuff:OnCreated(params)
	if IsServer() then
		self.movespeed_pct = self:GetAbility():GetSpecialValueFor("slow_amount")
	end
end

function modifier_artoria_excalibur_debuff:GetModifierMoveSpeedBonus_Percentage()
	return self.movespeed_pct
end
