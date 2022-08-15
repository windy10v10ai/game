
item_excalibur = class({})
LinkLuaModifier( "modifier_item_excalibur", "items/item_excalibur", LUA_MODIFIER_MOTION_NONE )

function item_excalibur:GetIntrinsicModifierName()
	return "modifier_item_excalibur"
end

--------------------------------------------------------------------------------
-- Modifier
--------------------------------------------------------------------------------

modifier_item_excalibur = class({})

--------------------------------------------------------------------------------

function modifier_item_excalibur:IsHidden()
	return true
end
function modifier_item_excalibur:IsPurgable()
	return false
end

--------------------------------------------------------------------------------

function modifier_item_excalibur:OnCreated( kv )
	self.bonus_damage = self:GetAbility():GetSpecialValueFor( "bonus_damage" )
	self.bonus_damage_percent = self:GetAbility():GetSpecialValueFor( "bonus_damage_percent" )
end

--------------------------------------------------------------------------------


function modifier_item_excalibur:CheckState()
	return {
		[MODIFIER_STATE_CANNOT_MISS] = true,
	}
end

function modifier_item_excalibur:DeclareFunctions()
	local funcs =
	{
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE,
	}
	return funcs
end

--------------------------------------------------------------------------------

function modifier_item_excalibur:GetModifierPreAttack_BonusDamage( params )
	return self.bonus_damage
end

function modifier_item_excalibur:GetModifierBaseDamageOutgoing_Percentage( params )
	return self.bonus_damage_percent
end
