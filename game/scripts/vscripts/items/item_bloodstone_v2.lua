item_bloodstone_v2 = class({})
LinkLuaModifier("modifier_item_bloodstone_v2", "items/item_bloodstone_v2", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_bloodstone_v2_amp", "items/item_bloodstone_v2", LUA_MODIFIER_MOTION_NONE)

function item_bloodstone_v2:GetIntrinsicModifierName()
	return "modifier_item_bloodstone_v2"
end

function item_bloodstone_v2:OnSpellStart()
	local caster = self:GetCaster()
	local duration = self:GetSpecialValueFor("buff_duration")
	caster:AddNewModifier(caster, self, "modifier_item_bloodstone_v2_amp", {duration = duration})
end

if modifier_item_bloodstone_v2 == nil then modifier_item_bloodstone_v2 = class({}) end

function modifier_item_bloodstone_v2:IsPurgable() return false end
function modifier_item_bloodstone_v2:IsDebuff() return false end
function modifier_item_bloodstone_v2:RemoveOnDeath() return false end
function modifier_item_bloodstone_v2:IsHidden() return true end

function modifier_item_bloodstone_v2:OnCreated(kv)
	if not IsServer() then return end
	self.spell_lifesteal = self:GetAbility():GetSpecialValueFor("spell_lifesteal")
	self.bonus_health = self:GetAbility():GetSpecialValueFor("bonus_health")
	self.bonus_mana = self:GetAbility():GetSpecialValueFor("bonus_mana")
end

function modifier_item_bloodstone_v2:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_TAKEDAMAGE,
		MODIFIER_PROPERTY_HEALTH_BONUS,
		MODIFIER_PROPERTY_MANA_BONUS,
	}
end

function modifier_item_bloodstone_v2:GetModifierHealthBonus()
	return self.bonus_health
end

function modifier_item_bloodstone_v2:GetModifierManaBonus( params )
	return self.bonus_mana
end

function modifier_item_bloodstone_v2:OnTakeDamage(keys)
	if not IsServer() then
		return
	end
	local amp = nil
	if self:GetParent():HasModifier("modifier_item_bloodstone_v2_amp") then
		amp = self:GetAbility():GetSpecialValueFor("lifesteal_multiplier")
	end
	SpellLifeSteal(keys,self,self.spell_lifesteal,amp)
end

if modifier_item_bloodstone_v2_amp == nil then modifier_item_bloodstone_v2_amp = class({}) end

function modifier_item_bloodstone_v2_amp:IsPurgable() return false end
function modifier_item_bloodstone_v2_amp:IsDebuff() return false end
function modifier_item_bloodstone_v2_amp:RemoveOnDeath() return false end
function modifier_item_bloodstone_v2_amp:IsHidden() return true end

function modifier_item_bloodstone_v2_amp:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_TAKEDAMAGE,
	}
end

function modifier_item_bloodstone_v2_amp:OnCreated(kv)
	if not IsServer() then
		return
	end
	self.particleId = ParticleManager:CreateParticle("particles/items_fx/bloodstone_heal_model.vpcf", PATTACH_OVERHEAD_FOLLOW, self:GetParent())
	self:GetParent():EmitSound('DOTA_Item.Bloodstone.Cast')
end

function modifier_item_bloodstone_v2_amp:OnTakeDamage(keys)
	local hero = self:GetParent()
	if keys.attacker == hero and keys.inflictor and IsEnemy(keys.attacker, keys.unit) and
			bit.band(keys.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) ~= DOTA_DAMAGE_FLAG_REFLECTION then
		hero:SetMana(hero:GetMana() + keys.damage)
		local pfx = ParticleManager:CreateParticle("particles/items_fx/bloodstone_heal_fx_flare.vpcf", PATTACH_ABSORIGIN_FOLLOW, hero)
		ParticleManager:ReleaseParticleIndex(pfx)
	end
end

function modifier_item_bloodstone_v2_amp:OnDestroy(kv)
	ParticleManager:DestroyParticle(self.particleId, true)
	ParticleManager:ReleaseParticleIndex(self.particleId)
end



