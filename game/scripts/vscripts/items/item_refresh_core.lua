LinkLuaModifier( "modifier_item_refresh_core", "items/item_refresh_core.lua", LUA_MODIFIER_MOTION_NONE )
--Abilities
if item_refresh_core == nil then
	item_refresh_core = class({})
end
function item_refresh_core:GetIntrinsicModifierName()
	return "modifier_item_refresh_core"
end

function item_refresh_core:OnSpellStart()
	local caster = self:GetCaster()
	-- find all refreshable abilities
	for i=0,caster:GetAbilityCount()-1 do
		local ability = caster:GetAbilityByIndex( i )
		if ability and ability:GetAbilityType()~=DOTA_ABILITY_TYPE_ATTRIBUTES then
			ability:RefreshCharges()
			ability:EndCooldown()
		end
	end

	-- find all refreshable items
	for i=0,8 do
		local item = caster:GetItemInSlot(i)
		if item and item:GetPurchaser()==caster and not self:IsItemException( item ) then
			item:EndCooldown()
		end
	end

	local item = caster:GetItemInSlot(DOTA_ITEM_TP_SCROLL)
	if item then
		item:EndCooldown()
	end

	-- effects
	local sound_cast = "DOTA_Item.Refresher.Activate"
	caster:EmitSound( sound_cast )

	local particle_cast = "particles/items2_fx/refresher.vpcf"
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, caster )
	ParticleManager:ReleaseParticleIndex( effect_cast )
end
function item_refresh_core:IsItemException( item )
	return self.ItemException[item:GetName()]
end
item_refresh_core.ItemException = {
	["item_refresher"] = true,
	["item_refresher_shard"] = true,
	["item_refresh_core"] = true,
}
---------------------------------------------------------------------
--Modifiers
if modifier_item_refresh_core == nil then
	modifier_item_refresh_core = class({})
end
function modifier_item_refresh_core:IsHidden()		return true end
function modifier_item_refresh_core:IsPurgable()	return false end
function modifier_item_refresh_core:RemoveOnDeath()	return false end
function modifier_item_refresh_core:GetAttributes()	return MODIFIER_ATTRIBUTE_MULTIPLE end


function modifier_item_refresh_core:OnCreated()
	self.bonus_cooldown = self:GetAbility():GetSpecialValueFor("bonus_cooldown")
	self.cast_range_bonus = self:GetAbility():GetSpecialValueFor("cast_range_bonus")
	self.bonus_health = self:GetAbility():GetSpecialValueFor("bonus_health")
	self.bonus_mana = self:GetAbility():GetSpecialValueFor("bonus_mana")
	self.bonus_health_regen = self:GetAbility():GetSpecialValueFor("bonus_health_regen")
	self.bonus_mana_regen = self:GetAbility():GetSpecialValueFor("bonus_mana_regen")

end


function modifier_item_refresh_core:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE,
		MODIFIER_PROPERTY_CAST_RANGE_BONUS,
		MODIFIER_PROPERTY_HEALTH_BONUS,
		MODIFIER_PROPERTY_MANA_BONUS,
		MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
		MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
	}
end

function modifier_item_refresh_core:GetModifierPercentageCooldown()
	return self.bonus_cooldown
end
function modifier_item_refresh_core:GetModifierCastRangeBonus()
	return self.cast_range_bonus
end
function modifier_item_refresh_core:GetModifierHealthBonus()
	return self.bonus_health
end
function modifier_item_refresh_core:GetModifierManaBonus()
	return self.bonus_mana
end
function modifier_item_refresh_core:GetModifierConstantHealthRegen()
	return self.bonus_health_regen
end
function modifier_item_refresh_core:GetModifierConstantManaRegen()
	return self.bonus_mana_regen
end
