LinkLuaModifier( "modifier_item_arcane_octarine_core", "items/item_arcane_octarine_core.lua", LUA_MODIFIER_MOTION_NONE )
--Abilities
if item_arcane_octarine_core == nil then
	item_arcane_octarine_core = class({})
end
function item_arcane_octarine_core:GetIntrinsicModifierName()
	return "modifier_item_arcane_octarine_core"
end
---------------------------------------------------------------------
--Modifiers
if modifier_item_arcane_octarine_core == nil then
	modifier_item_arcane_octarine_core = class({})
end
function modifier_item_arcane_octarine_core:IsHidden()		return true end
function modifier_item_arcane_octarine_core:IsPurgable()	return false end
function modifier_item_arcane_octarine_core:RemoveOnDeath()	return false end
function modifier_item_arcane_octarine_core:GetAttributes()	return MODIFIER_ATTRIBUTE_MULTIPLE end

function modifier_item_arcane_octarine_core:OnCreated(params)
	self.bonus_cooldown = self:GetAbility():GetSpecialValueFor("bonus_cooldown")
	self.bonus_health = self:GetAbility():GetSpecialValueFor("bonus_health")
	self.bonus_mana = self:GetAbility():GetSpecialValueFor("bonus_mana")
	self.bonus_health_regen = self:GetAbility():GetSpecialValueFor("bonus_health_regen")
	self.bonus_mana_regen = self:GetAbility():GetSpecialValueFor("bonus_mana_regen")
	self.cast_range_bonus = self:GetAbility():GetSpecialValueFor("cast_range_bonus")

	if IsServer() then
		for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
			mod:GetAbility():SetSecondaryCharges(_)
		end
	end
end
function modifier_item_arcane_octarine_core:OnRefresh(params)
	if IsServer() then
	end
end
function modifier_item_arcane_octarine_core:OnDestroy()
	if IsServer() then
		for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
			mod:GetAbility():SetSecondaryCharges(_)
		end
	end
end
function modifier_item_arcane_octarine_core:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_HEALTH_BONUS,
		MODIFIER_PROPERTY_MANA_BONUS,
		MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
		MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS,
	}
end
function modifier_item_arcane_octarine_core:GetModifierPercentageCooldown()
	if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
		if self:GetParent():HasModifier("modifier_item_octarine_core") then
			return 0
		else
			return self.bonus_cooldown
		end
	end
end
function modifier_item_arcane_octarine_core:GetModifierHealthBonus()
	return self.bonus_health
end
function modifier_item_arcane_octarine_core:GetModifierManaBonus()
	return self.bonus_mana
end
function modifier_item_arcane_octarine_core:GetModifierConstantHealthRegen()
	return self.bonus_health_regen
end
function modifier_item_arcane_octarine_core:GetModifierConstantManaRegen()
	return self.bonus_mana_regen
end
function modifier_item_arcane_octarine_core:GetModifierCastRangeBonus()
	return self.cast_range_bonus
end
