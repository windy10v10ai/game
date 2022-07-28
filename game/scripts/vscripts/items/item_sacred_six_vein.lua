if item_sacred_six_vein == nil then item_sacred_six_vein = class({}) end

LinkLuaModifier("modifier_item_sacred_six_vein", "items/item_sacred_six_vein.lua", LUA_MODIFIER_MOTION_NONE)

function item_sacred_six_vein:GetIntrinsicModifierName()
	return "modifier_item_sacred_six_vein" end

if modifier_item_sacred_six_vein == nil then modifier_item_sacred_six_vein = class({}) end


function modifier_item_sacred_six_vein:IsHidden()		return true end
function modifier_item_sacred_six_vein:IsPurgable()		return false end
function modifier_item_sacred_six_vein:RemoveOnDeath()	return false end
function modifier_item_sacred_six_vein:GetAttributes()	return MODIFIER_ATTRIBUTE_MULTIPLE end

function modifier_item_sacred_six_vein:OnCreated()
	if not self:GetAbility() then self:Destroy() return end

	self.bonus_strength = self:GetAbility():GetSpecialValueFor("bonus_strength")
	self.status_resistance = self:GetAbility():GetSpecialValueFor("status_resistance")
	self.hp_regen_amp = self:GetAbility():GetSpecialValueFor("hp_regen_amp")
	self.bonus_agility = self:GetAbility():GetSpecialValueFor("bonus_agility")
	self.movement_speed_percent_bonus = self:GetAbility():GetSpecialValueFor("movement_speed_percent_bonus")
	self.bonus_intellect = self:GetAbility():GetSpecialValueFor("bonus_intellect")
	self.spell_amp = self:GetAbility():GetSpecialValueFor("spell_amp")
	self.spell_lifesteal_amp = self:GetAbility():GetSpecialValueFor("spell_lifesteal_amp")
	self.mana_regen_multiplier = self:GetAbility():GetSpecialValueFor("mana_regen_multiplier")
end

function modifier_item_sacred_six_vein:OnDestroy()
end

function modifier_item_sacred_six_vein:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
		MODIFIER_PROPERTY_STATUS_RESISTANCE,
		MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_LIFESTEAL_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE_UNIQUE,
		MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE_UNIQUE,
		MODIFIER_PROPERTY_SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_MP_REGEN_AMPLIFY_PERCENTAGE,
	}
end

function modifier_item_sacred_six_vein:GetModifierBonusStats_Strength()
	return self.bonus_strength
end

function modifier_item_sacred_six_vein:GetModifierBonusStats_Agility()
	return self.bonus_agility
end

function modifier_item_sacred_six_vein:GetModifierBonusStats_Intellect()
	return self.bonus_intellect
end

function modifier_item_sacred_six_vein:GetModifierStatusResistance()
	return self.status_resistance
end

function modifier_item_sacred_six_vein:GetModifierHPRegenAmplify_Percentage()
	return self.hp_regen_amp
end

function modifier_item_sacred_six_vein:GetModifierLifestealRegenAmplify_Percentage()
	return self.hp_regen_amp
end

function modifier_item_sacred_six_vein:GetModifierMoveSpeedBonus_Percentage_Unique()
	return self.movement_speed_percent_bonus
end

function modifier_item_sacred_six_vein:GetModifierSpellAmplify_PercentageUnique()
	return self.spell_amp
end

function modifier_item_sacred_six_vein:GetModifierSpellLifestealRegenAmplify_Percentage()
	return self.spell_lifesteal_amp
end

function modifier_item_sacred_six_vein:GetModifierMPRegenAmplify_Percentage()
	return self.mana_regen_multiplier
end
