function WingsOfHasteOnSpell(keys)
	local modifierName = keys.modifier
	if keys.target:HasModifier(modifierName) then
		return UF_FAIL_CUSTOM
	end
	if (keys.caster:IsRealHero() or keys.caster:GetName() == "npc_dota_lone_druid_bear") and (keys.target:IsRealHero() or keys.target:GetName() == "npc_dota_lone_druid_bear") and not keys.caster:HasModifier("modifier_arc_warden_tempest_double") and not keys.target:HasModifier("modifier_arc_warden_tempest_double") then
		keys.target:AddNewModifier(keys.caster, keys.ability, modifierName, {})
		keys.target:EmitSound("Hero_Alchemist.Scepter.Cast")
		keys.caster:RemoveItem(keys.ability)
	end
end

LinkLuaModifier("modifier_item_wings_of_haste_consumed", "items/item_wings_of_haste.lua", LUA_MODIFIER_MOTION_NONE)

if modifier_item_wings_of_haste_consumed == nil then modifier_item_wings_of_haste_consumed = class({}) end

function modifier_item_wings_of_haste_consumed:RemoveOnDeath() return false end
function modifier_item_wings_of_haste_consumed:IsPurgable() return false end
function modifier_item_wings_of_haste_consumed:IsPermanent() return true end

function modifier_item_wings_of_haste_consumed:OnCreated()
	if self:GetAbility() then
		self.bonus_movement_speed = self:GetAbility():GetSpecialValueFor("bonus_movement_speed")
		self.bonus_attack_speed = self:GetAbility():GetSpecialValueFor("bonus_attack_speed")
		self.bonus_health_regen = self:GetAbility():GetSpecialValueFor("bonus_health_regen")
		self.bonus_mana_regen = self:GetAbility():GetSpecialValueFor("bonus_mana_regen")
	end
end

function modifier_item_wings_of_haste_consumed:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BONUS_UNIQUE,
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
		MODIFIER_PROPERTY_MANA_REGEN_CONSTANT
	}
end

function modifier_item_wings_of_haste_consumed:GetModifierMoveSpeedBonus_Special_Boots()
	return self.bonus_movement_speed
end

function modifier_item_wings_of_haste_consumed:GetModifierAttackSpeedBonus_Constant()
	return self.bonus_attack_speed
end

function modifier_item_wings_of_haste_consumed:GetModifierConstantHealthRegen()
	return self.bonus_health_regen
end

function modifier_item_wings_of_haste_consumed:GetModifierConstantManaRegen()
	return self.bonus_mana_regen
end

function modifier_item_wings_of_haste_consumed:AllowIllusionDuplicate()
	return false
end

function modifier_item_wings_of_haste_consumed:GetTexture()
	return "item_wings_of_haste"
end
