if item_dragon_lance_pro_max == nil then item_dragon_lance_pro_max = class({}) end

LinkLuaModifier("modifier_item_dragon_lance_pro_max", 			"items/item_dragon_lance_pro_max.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_dragon_lance_pro_max_active", 	"items/item_dragon_lance_pro_max.lua", LUA_MODIFIER_MOTION_NONE)

function item_dragon_lance_pro_max:GetIntrinsicModifierName()
	return "modifier_item_dragon_lance_pro_max" end

function item_dragon_lance_pro_max:OnSpellStart()
	local caster = self:GetCaster()
	local duration = self:GetSpecialValueFor("active_boost_duration")

    EmitSoundOn("dragon_lance", caster)
    caster:AddNewModifier(caster, self, "modifier_item_dragon_lance_pro_max_active", {duration = duration})
end

if modifier_item_dragon_lance_pro_max == nil then modifier_item_dragon_lance_pro_max = class({}) end

function modifier_item_dragon_lance_pro_max:IsHidden()		return true end
function modifier_item_dragon_lance_pro_max:IsPurgable()	return false end
function modifier_item_dragon_lance_pro_max:RemoveOnDeath()	return false end
function modifier_item_dragon_lance_pro_max:GetAttributes()	return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE end

function modifier_item_dragon_lance_pro_max:OnCreated()

	local ability = self:GetAbility()
	if (not ability) or ability:IsNull() then return end
	self.bonus_agility = ability:GetSpecialValueFor("bonus_agility")
	self.bonus_strength = ability:GetSpecialValueFor("bonus_strength")
	self.bonus_attack_range = ability:GetSpecialValueFor("bonus_attack_range")

	if IsServer() then
        if not self:GetAbility() then self:Destroy() end
		for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
			mod:GetAbility():SetSecondaryCharges(_)
		end
    end

end

function modifier_item_dragon_lance_pro_max:OnDestroy()
	if not IsServer() then return end

	for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
		mod:GetAbility():SetSecondaryCharges(_)
	end
end

function modifier_item_dragon_lance_pro_max:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS_UNIQUE,
	}
end


function modifier_item_dragon_lance_pro_max:GetModifierBonusStats_Agility()
	return self.bonus_agility
end
function modifier_item_dragon_lance_pro_max:GetModifierBonusStats_Strength()
	return self.bonus_strength
end
function modifier_item_dragon_lance_pro_max:GetModifierAttackRangeBonusUnique()
	return self.bonus_attack_range
end



modifier_item_dragon_lance_pro_max_active = class({})

function modifier_item_dragon_lance_pro_max_active:IsPermanent()	return false end
function modifier_item_dragon_lance_pro_max_active:IsHidden()		return false end
function modifier_item_dragon_lance_pro_max_active:IsPurgeable() 	return false end

function modifier_item_dragon_lance_pro_max_active:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
	}
end

function modifier_item_dragon_lance_pro_max_active:GetModifierAttackSpeedBonus_Constant()
	return self:GetAbility():GetSpecialValueFor("active_boost")
end

function modifier_item_dragon_lance_pro_max_active:GetTexture()
    return "item_dragon_lance"
end

function modifier_item_dragon_lance_pro_max_active:GetEffectName()
	return "particles/items4_fx/arcane_scepter.vpcf"
end

function modifier_item_dragon_lance_pro_max_active:GetEffectAttachType()
	return PATTACH_ABSORIGIN_FOLLOW
end
