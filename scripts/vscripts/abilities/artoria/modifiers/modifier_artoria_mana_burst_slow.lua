-----------------------------
--    Modifier: Mana Burst Slow    --
-----------------------------

modifier_artoria_mana_burst_slow = class({})

-- Classification --
function modifier_artoria_mana_burst_slow:OnCreated( kv )
	if IsServer() then
		slow_amount = self:GetAbility():GetSpecialValueFor("slow_amount")
	end
end

function modifier_artoria_mana_burst_slow:IsHidden()
	return true
end

function modifier_artoria_mana_burst_slow:IsDebuff()
	return true
end

function modifier_artoria_mana_burst_slow:IsStunDebuff()
	return false
end

function modifier_artoria_mana_burst_slow:IsPurgable()
	return true
end

function modifier_artoria_mana_burst_slow:RemoveOnDeath()
    return true
end

-- Modifier Effects --
function modifier_artoria_mana_burst_slow:DeclareFunctions()
	local funcs = {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
	}

	return funcs
end

function modifier_artoria_mana_burst_slow:GetModifierMoveSpeedBonus_Percentage()
	return slow_amount
end