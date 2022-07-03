-----------------------------------------------------------------------------------------------------------
--	Item Definition
-----------------------------------------------------------------------------------------------------------
if item_pirate_hat_custom == nil then item_pirate_hat_custom = class({}) end
LinkLuaModifier( "modifier_item_pirate_hat_custom", "items/item_pirate_hat_custom.lua", LUA_MODIFIER_MOTION_NONE )

function item_pirate_hat_custom:GetIntrinsicModifierName()
	return "modifier_item_pirate_hat_custom" end


if modifier_item_pirate_hat_custom == nil then modifier_item_pirate_hat_custom = class({}) end

function modifier_item_pirate_hat_custom:IsHidden() return true end
function modifier_item_pirate_hat_custom:IsPurgable() return false end
function modifier_item_pirate_hat_custom:RemoveOnDeath() return false end
function modifier_item_pirate_hat_custom:GetAttributes() return MODIFIER_ATTRIBUTE_NONE end

function modifier_item_pirate_hat_custom:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT
	}
end

function modifier_item_pirate_hat_custom:GetPriority()
	return MODIFIER_PRIORITY_LOW
end

function modifier_item_pirate_hat_custom:GetModifierAttackSpeedBonus_Constant()
		return self:GetAbility():GetSpecialValueFor("bonus_attack_speed")
end

function modifier_item_pirate_hat_custom:GetModifierBaseAttackTimeConstant()
	if self.bat_check ~= true then
		self.bat_check = true
        local current_bat = self:GetParent():GetBaseAttackTime()
        
        local bat_reduction = self:GetAbility():GetSpecialValueFor("bat_reduction")
        local new_bat = current_bat - bat_reduction
        self.bat_check = false
        return new_bat
    end
end