LinkLuaModifier( "modifier_item_refresh_core", "items/item_refresh_core.lua", LUA_MODIFIER_MOTION_NONE )
--Abilities
if item_refresh_core == nil then
	item_refresh_core = class({})
end
function item_refresh_core:GetIntrinsicModifierName()
	return "modifier_item_refresh_core"
end

function item_refresh_core:IsRefreshable()
	return false
end

function item_refresh_core:OnSpellStart()
	local caster = self:GetCaster()
	-- find all refreshable abilities
	for i=0,caster:GetAbilityCount()-1 do
		local ability = caster:GetAbilityByIndex( i )
		if ability and ability:GetAbilityType()~=ABILITY_TYPE_ATTRIBUTES and not self:IsAbitilyException( ability ) then
			ability:RefreshCharges()
			ability:EndCooldown()
		end
	end

	-- find all refreshable items
	for i=0,8 do
		local item = caster:GetItemInSlot(i)
		self:RefreshItem( item, caster )
	end

	local itemTp = caster:GetItemInSlot(DOTA_ITEM_TP_SCROLL)
	self:RefreshItem( itemTp, caster )
	local itemNeutral = caster:GetItemInSlot(DOTA_ITEM_NEUTRAL_SLOT )
	self:RefreshItem( itemNeutral, caster )

	-- effects
	local sound_cast = "DOTA_Item.Refresher.Activate"
	caster:EmitSound( sound_cast )

	local particle_cast = "particles/items2_fx/refresher.vpcf"
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, caster )
	ParticleManager:ReleaseParticleIndex( effect_cast )
end

function item_refresh_core:IsAbitilyException( ability )
	return self.AbitilyException[ability:GetName()]
end
item_refresh_core.AbitilyException = {
	["dazzle_good_juju"] = true,
}

function item_refresh_core:RefreshItem( item, caster )
	if item and item:GetPurchaser()==caster then
		if item:IsRefreshable() then
			item:EndCooldown()
		end
		if self.ItemShareCooldown[item:GetName()] then
			item:StartCooldown( self:GetCooldownTimeRemaining() )
		end
	end
end
item_refresh_core.ItemShareCooldown = {
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
	local ability = self:GetAbility()
	if ability then
		self.bonus_cooldown = ability:GetSpecialValueFor("bonus_cooldown")
		self.bonus_cooldown_stack = ability:GetSpecialValueFor("bonus_cooldown_stack")
		self.cast_range_bonus = ability:GetSpecialValueFor("cast_range_bonus")
		self.bonus_health = ability:GetSpecialValueFor("bonus_health")
		self.bonus_mana = ability:GetSpecialValueFor("bonus_mana")
		self.bonus_health_regen = ability:GetSpecialValueFor("bonus_health_regen")
		self.bonus_mana_regen = ability:GetSpecialValueFor("bonus_mana_regen")
	end

	if IsServer() then
		for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
			mod:GetAbility():SetSecondaryCharges(_)
		end
	end
end

function modifier_item_refresh_core:OnDestroy()
	if IsServer() then
		for _, mod in pairs(self:GetParent():FindAllModifiersByName(self:GetName())) do
			mod:GetAbility():SetSecondaryCharges(_)
		end
	end
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
	if self:GetAbility() and self:GetAbility():GetSecondaryCharges() == 1 then
		if self:GetParent():HasModifier("modifier_item_octarine_core")
			or self:GetParent():HasModifier("modifier_item_arcane_octarine_core") then
			return self.bonus_cooldown_stack
		else
			return self.bonus_cooldown
		end
	end
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
