item_tome_of_luoshu = class({})
LinkLuaModifier("modifier_luoshu_tome", "items/item_tome_of_luoshu.lua", LUA_MODIFIER_MOTION_NONE)

if IsServer() then
	function item_tome_of_luoshu:OnSpellStart()
		local caster = self:GetCaster()
		if caster:HasModifier("modifier_luoshu_tome") then
			return
		else
			local bonus_all_stats = self:GetSpecialValueFor("bonus_all_stats")
			caster:ModifyIntellect(bonus_all_stats)
			caster:ModifyAgility(bonus_all_stats)
			caster:ModifyStrength(bonus_all_stats)
			caster:AddNewModifier(caster, self, "modifier_luoshu_tome", {})
			ApplyItemDataDrivenModifier(caster, "item_apply_modifiers", "modifier_item_tome_of_luoshu_stats", {})
			EmitSoundOnClient("Item.TomeOfKnowledge", caster)
		end
		self:SpendCharge(1)
	end
end

function item_tome_of_luoshu:CastFilterResult()
	local caster = self:GetCaster()
	if caster:HasModifier("modifier_luoshu_tome") then
		return UF_FAIL_CUSTOM
	end
end

function item_tome_of_luoshu:GetCustomCastError()
	return "#DOTA_Tooltip_ability_item_tome_of_luoshu_cast_error"
end

if modifier_luoshu_tome == nil then modifier_luoshu_tome = class({}) end

function modifier_luoshu_tome:RemoveOnDeath() return false end

function modifier_luoshu_tome:IsPermanent() return true end

function modifier_luoshu_tome:OnCreated()
	if self:GetAbility() then
		self.status_resistance = self:GetAbility():GetSpecialValueFor("status_resistance")
		self.bonus_cast_range = self:GetAbility():GetSpecialValueFor("bonus_cast_range")
	end
end

function modifier_luoshu_tome:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING,
	}
end

function modifier_luoshu_tome:GetModifierStatusResistanceStacking()
	return self.status_resistance
end

function modifier_luoshu_tome:GetModifierCastRangeBonusStacking()
	return self.bonus_cast_range
end

function modifier_luoshu_tome:GetTexture()
	return "item_tome_of_luoshu"
end
