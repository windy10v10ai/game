if item_dragon_lance_plus == nil then item_dragon_lance_plus = class({}) end

LinkLuaModifier("modifier_item_dragon_lance_plus", 			"items/item_dragon_lance_plus.lua", LUA_MODIFIER_MOTION_NONE)	
LinkLuaModifier("modifier_item_dragon_lance_plus_active", 	"items/item_dragon_lance_plus.lua", LUA_MODIFIER_MOTION_NONE)

function item_dragon_lance_plus:GetIntrinsicModifierName()
	return "modifier_item_dragon_lance_plus" end

function item_dragon_lance_plus:OnSpellStart()
	local caster = self:GetCaster()
	local duration = self:GetSpecialValueFor("active_boost_duration")
    
    EmitSoundOn("dragon_lance", caster)
    caster:AddNewModifier(caster, self, "modifier_item_dragon_lance_plus_active", {duration = duration})
end 

if modifier_item_dragon_lance_plus == nil then modifier_item_dragon_lance_plus = class({}) end

function modifier_item_dragon_lance_plus:IsHidden()		return true end
function modifier_item_dragon_lance_plus:IsPurgable()	return false end
function modifier_item_dragon_lance_plus:RemoveOnDeath()	return false end
function modifier_item_dragon_lance_plus:GetAttributes()	return MODIFIER_ATTRIBUTE_MULTIPLE end

function modifier_item_dragon_lance_plus:OnCreated()
	if IsServer() then
        if not self:GetAbility() then self:Destroy() end
    end
	
	if not IsServer() then return end

	for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
		mod:GetAbility():SetSecondaryCharges(_)
	end 
end 

function modifier_item_dragon_lance_plus:OnDestroy()
	if not IsServer() then return end

	for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
		mod:GetAbility():SetSecondaryCharges(_)
	end 
end
 
function modifier_item_dragon_lance_plus:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_ATTACK_RANGE_BONUS_UNIQUE,
	}
end 


function modifier_item_dragon_lance_plus:GetModifierBonusStats_Agility()
	if self:GetAbility() then
		return self:GetAbility():GetSpecialValueFor("bonus_agility")
	end 
end 
function modifier_item_dragon_lance_plus:GetModifierBonusStats_Strength()
	if self:GetAbility() then
		return self:GetAbility():GetSpecialValueFor("bonus_strength")
	end 
end 
function modifier_item_dragon_lance_plus:GetModifierAttackRangeBonusUnique()
	if self:GetAbility() and self:GetParent():IsRangedAttacker() then
		return self:GetAbility():GetSpecialValueFor("bonus_attack_range")
	end 
end 



modifier_item_dragon_lance_plus_active = class({})

function modifier_item_dragon_lance_plus_active:IsPermanent()	return false end 
function modifier_item_dragon_lance_plus_active:IsHidden()		return false end 
function modifier_item_dragon_lance_plus_active:IsPurgeable() 	return false end 

function modifier_item_dragon_lance_plus_active:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
	}
end 

function modifier_item_dragon_lance_plus_active:GetModifierAttackSpeedBonus_Constant()
	return self:GetAbility():GetSpecialValueFor("active_boost")
end

function modifier_item_dragon_lance_plus_active:GetTexture()
    return "item_dragon_lance"
end

function modifier_item_dragon_lance_plus_active:GetEffectName()
	return "particles/items4_fx/arcane_scepter.vpcf" 
end

function modifier_item_dragon_lance_plus_active:GetEffectAttachType()
	return PATTACH_ABSORIGIN_FOLLOW 
end