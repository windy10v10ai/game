if item_excalibur == nil then item_excalibur = class({}) end
LinkLuaModifier( "modifier_item_excalibur", "items/item_excalibur", LUA_MODIFIER_MOTION_NONE )

function item_excalibur:GetIntrinsicModifierName()
	return "modifier_item_excalibur"
end

--------------------------------------------------------------------------------
-- Modifier
--------------------------------------------------------------------------------

if modifier_item_excalibur == nil then modifier_item_excalibur = class({}) end

--------------------------------------------------------------------------------

function modifier_item_excalibur:IsHidden()
	return true
end
function modifier_item_excalibur:IsPurgable()
	return false
end
function modifier_item_excalibur:GetAttributes()
	return MODIFIER_ATTRIBUTE_MULTIPLE
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
	return {
		MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
		MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE,
	}
end

--------------------------------------------------------------------------------

function modifier_item_excalibur:GetModifierPreAttack_BonusDamage( params )
	return self.bonus_damage
end

function modifier_item_excalibur:GetModifierBaseDamageOutgoing_Percentage( params )
	return self.bonus_damage_percent
end
