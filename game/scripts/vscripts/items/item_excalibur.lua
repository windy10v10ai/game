LinkLuaModifier( "modifier_item_excalibur", "items/item_excalibur.lua", LUA_MODIFIER_MOTION_NONE )

if item_excalibur == nil then item_excalibur = class({}) end

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
	return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE + MODIFIER_ATTRIBUTE_PERMANENT
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
