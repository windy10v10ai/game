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
	self.value = self:GetAbility():GetSpecialValueFor("spell_lifesteal")
end

function modifier_item_bloodstone_v2:DeclareFunctions()
	return {
		MODIFIER_EVENT_ON_TAKEDAMAGE,
	}
end

function modifier_item_bloodstone_v2:OnTakeDamage(keys)
	if not IsServer() then
		return
	end
	if keys.attacker == self:GetParent() and keys.inflictor and IsEnemy(keys.attacker, keys.unit) and
			bit.band(keys.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) ~= DOTA_DAMAGE_FLAG_REFLECTION and
			bit.band(keys.damage_flags, DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL) ~= DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL then
		local dmg = keys.damage * (self.value / 100)
		if self:GetParent():HasModifier("modifier_item_bloodstone_v2_amp") then
			dmg = dmg * self:GetAbility():GetSpecialValueFor("lifesteal_multiplier")
		end
		if keys.unit:IsCreep() then
			dmg = dmg / 5
		end
		self:GetParent():Heal(dmg, self.ability)
		local pfx = ParticleManager:CreateParticle("particles/items3_fx/octarine_core_lifesteal.vpcf", PATTACH_ABSORIGIN_FOLLOW, self:GetParent())
		ParticleManager:ReleaseParticleIndex(pfx)
	end
end

if modifier_item_bloodstone_v2_amp == nil then modifier_item_bloodstone_v2_amp = class({}) end

function modifier_item_bloodstone_v2_amp:IsPurgable() return false end
function modifier_item_bloodstone_v2_amp:IsDebuff() return false end
function modifier_item_bloodstone_v2_amp:RemoveOnDeath() return false end
function modifier_item_bloodstone_v2_amp:IsHidden() return true end

function modifier_item_bloodstone_v2_amp:OnCreated(kv)
	if not IsServer() then
		return
	end
	self.particleId = ParticleManager:CreateParticle("particles/items_fx/bloodstone_heal_model.vpcf", PATTACH_OVERHEAD_FOLLOW, self:GetParent())
	self:GetParent():EmitSound('DOTA_Item.Bloodstone.Cast')
end

function modifier_item_bloodstone_v2_amp:OnDestroy(kv)
	ParticleManager:DestroyParticle(self.particleId, true)
	ParticleManager:ReleaseParticleIndex(self.particleId)
end



