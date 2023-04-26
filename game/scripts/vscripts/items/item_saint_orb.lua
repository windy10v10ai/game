item_saint_orb = class({})
LinkLuaModifier("modifier_item_saint_orb_passive", "items/item_saint_orb", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_saint_orb_buff", "items/item_saint_orb", LUA_MODIFIER_MOTION_NONE)
-- LinkLuaModifier("modifier_item_saint_orb_buff2", "items/item_saint_orb", LUA_MODIFIER_MOTION_NONE)
function item_saint_orb:GetIntrinsicModifierName() return "modifier_item_saint_orb_passive" end
function item_saint_orb:OnSpellStart()
	local caster	= self:GetCaster()
	local caster_location	= caster:GetAbsOrigin()
	local tar = self:GetCursorTarget()
	local dur = self:GetSpecialValueFor("duration")
	tar:EmitSound("Item.LotusOrb.Target")
	tar:AddNewModifier(caster,self,"modifier_item_saint_orb_buff",{duration = dur}) --林肯特效
	tar:AddNewModifier(caster,self,"modifier_item_lotus_orb_active",{duration = dur})	--原版莲花
end



--被动 无法被减速 恢复效果增加
modifier_item_saint_orb_passive = class({})
function modifier_item_saint_orb_passive:IsDebuff()			return false end
function modifier_item_saint_orb_passive:IsHidden() 		return true end
function modifier_item_saint_orb_passive:IsPurgable() 		return false end
function modifier_item_saint_orb_passive:IsPurgeException()	return false end
function modifier_item_saint_orb_passive:RemoveOnDeath()	return false end
function modifier_item_saint_orb_passive:GetAttributes()	return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE end

function modifier_item_saint_orb_passive:DeclareFunctions() return
	{
		MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_LIFESTEAL_AMPLIFY_PERCENTAGE,
		MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
		MODIFIER_PROPERTY_MANA_BONUS,
		MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
	}
end
function modifier_item_saint_orb_passive:CheckState()
		return {
			[MODIFIER_STATE_UNSLOWABLE]	= true
		}
end
function modifier_item_saint_orb_passive:OnCreated()
	self.stats_modifier_name = "modifier_item_saint_orb_stats"
	if self:GetAbility() == nil then return end
	local ab = self:GetAbility()
	self.mp = ab:GetSpecialValueFor("bonus_mana")
	self.hp_re = ab:GetSpecialValueFor("hp_re")
	self.mp_re = ab:GetSpecialValueFor("mana_re")
	self.heal_bonus = ab:GetSpecialValueFor("heal_bonus")
	if IsServer() then
		RefreshItemDataDrivenModifier(self:GetAbility(), self.stats_modifier_name)
	end
end
function modifier_item_saint_orb_passive:OnDestroy()
	if IsServer() then
		RefreshItemDataDrivenModifier(self:GetAbility(), self.stats_modifier_name)
	end
end

function modifier_item_saint_orb_passive:GetModifierConstantManaRegen()
	return self.mp_re
end
function modifier_item_saint_orb_passive:GetModifierManaBonus()
	return self.mp
end
function modifier_item_saint_orb_passive:GetModifierConstantHealthRegen()
	return self.hp_re
end
function modifier_item_saint_orb_passive:GetModifierHPRegenAmplify_Percentage()
	return self.heal_bonus
end
function modifier_item_saint_orb_passive:GetModifierLifestealRegenAmplify_Percentage ()
	return self.heal_bonus
end

modifier_item_saint_orb_buff = class({})
function modifier_item_saint_orb_buff:IsDebuff()					return false end
function modifier_item_saint_orb_buff:IsHidden() 					return false end
function modifier_item_saint_orb_buff:IsPurgable() 				return false end
function modifier_item_saint_orb_buff:IsPurgeException() 			return false end
function modifier_item_saint_orb_buff:DeclareFunctions() return {MODIFIER_PROPERTY_ABSORB_SPELL} end
function modifier_item_saint_orb_buff:GetTexture() 		return "item_saint_orb" end
function modifier_item_saint_orb_buff:OnCreated()
	if self:GetAbility() == nil then return end
	if IsServer() then
		self:GetParent():Purge(false, true, false, false, false)
		local pos=self:GetParent():GetAbsOrigin()
		local fx = ParticleManager:CreateParticle("particles/units/heroes/hero_templar_assassin/templar_assassin_refraction.vpcf", PATTACH_CUSTOMORIGIN_FOLLOW ,self:GetParent())
		ParticleManager:SetParticleControl(fx, 0, pos)
		ParticleManager:SetParticleControlEnt(fx, 1, self:GetParent(), PATTACH_ABSORIGIN_FOLLOW, "attach_hitloc", self:GetParent():GetAbsOrigin(), true)
		ParticleManager:SetParticleControl(fx, 5, pos)
		self:AddParticle( fx, false, false, 20, false, false )
	end
end

function modifier_item_saint_orb_buff:GetAbsorbSpell(keys)
	if not IsServer() then
		return 0
	end
	local caster = keys.ability:GetCaster()
	if not IsEnemy(caster, self:GetParent()) then
		return 0
	end
	local fx= ParticleManager:CreateParticle("particles/units/heroes/hero_templar_assassin/templar_loadout.vpcf", PATTACH_ABSORIGIN_FOLLOW,self:GetParent())
    ParticleManager:SetParticleControl(fx, 0, self:GetParent():GetAbsOrigin())
    ParticleManager:SetParticleControl(fx, 1, self:GetParent():GetAbsOrigin())
    ParticleManager:SetParticleControl(fx, 2, Vector(10,10,10))
    ParticleManager:ReleaseParticleIndex(fx)
	local hp = self:GetParent():GetMaxHealth()*self:GetAbility():GetSpecialValueFor("heal")*0.01
	self:GetParent():Heal(hp, self:GetParent())
	SendOverheadEventMessage(nil, OVERHEAD_ALERT_HEAL, self:GetParent(), hp, nil)
	self:Destroy()
	return 1
end
