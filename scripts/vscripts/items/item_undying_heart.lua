if item_undying_heart == nil then item_undying_heart = class({}) end

LinkLuaModifier("modifier_item_undying_heart","items/item_undying_heart.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_undying_heart_buff","items/item_undying_heart.lua", LUA_MODIFIER_MOTION_NONE)

function item_undying_heart:GetIntrinsicModifierName()
	return "modifier_item_undying_heart" 
end

function item_undying_heart:OnSpellStart()
	local caster = self:GetCaster()

    caster:EmitSound( "Item.GuardianGreaves.Activate" ) 
	local fx = ParticleManager:CreateParticle("particles/items3_fx/warmage.vpcf", PATTACH_ABSORIGIN, caster)
    ParticleManager:ReleaseParticleIndex(fx)

	local dur = self:GetSpecialValueFor("dur")
    caster:AddNewModifier( caster, self, "modifier_item_undying_heart_buff", {duration=dur} )

	local hp = self:GetSpecialValueFor("hp")
	local hp2=hp+caster:GetMaxHealth()*0.1
	caster:Heal(hp2, caster)
	SendOverheadEventMessage(caster, OVERHEAD_ALERT_HEAL, caster,hp2, nil)
	local fx2 = ParticleManager:CreateParticle("particles/items3_fx/warmage_recipient.vpcf", PATTACH_ABSORIGIN_FOLLOW, hero)
    ParticleManager:ReleaseParticleIndex(fx2)

	local health_c = math.min(1.3 - caster:GetHealth()/caster:GetMaxHealth(),1)
	if health_c<1 then 
		caster:Purge(false, true, false, false, false)
	else 
		caster:Purge(false, true, false, true, true)
	end
end



if modifier_item_undying_heart == nil then modifier_item_undying_heart = class({}) end

function modifier_item_undying_heart:IsHidden()		return true end
function modifier_item_undying_heart:IsPurgable()	return false end
function modifier_item_undying_heart:RemoveOnDeath()	return false end
function modifier_item_undying_heart:GetAttributes()	return MODIFIER_ATTRIBUTE_MULTIPLE end

function modifier_item_undying_heart:OnCreated()
	self.parent=self:GetParent()
	if IsServer() then
        if not self:GetAbility() then self:Destroy() end
    end
	self.ability=self:GetAbility()
	if self:GetAbility() then
		self.bonus_strength = self.ability:GetSpecialValueFor("bonus_strength")
		self.bonus_health = self.ability:GetSpecialValueFor("bonus_health")
		self.health_regen_pct = self.ability:GetSpecialValueFor("health_regen_pct")
		self.bonus_evasion = self.ability:GetSpecialValueFor("bonus_evasion")
		self.status_resistance = self.ability:GetSpecialValueFor("status_resistance")
	end
end 

function modifier_item_undying_heart:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_HEALTH_BONUS,
		MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE_UNIQUE,
		MODIFIER_PROPERTY_EVASION_CONSTANT,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_EVENT_ON_TAKEDAMAGE,
	}
end

function modifier_item_undying_heart:OnTakeDamage(tg)
	if not IsServer() then
		return
	end
    if tg.unit == self.parent then
        local hpjc=self.parent:GetMaxHealth()*0.15
        if self.parent:GetHealth() <= hpjc and self.ability:IsCooldownReady() and self.ability:IsOwnersManaEnough() and not self.parent:IsIllusion() and not self.parent:IsSilenced() and not self.parent:IsMuted() then
            self.ability:UseResources(true, true, true)
            self.ability:OnSpellStart()
            self.parent:Purge(false, true, false, true, true)
        end
	end
end

function modifier_item_undying_heart:GetModifierBonusStats_Strength()
	return self.bonus_strength
end

function modifier_item_undying_heart:GetModifierHealthBonus()
	return self.bonus_health
end

function modifier_item_undying_heart:GetModifierHealthRegenPercentageUnique()
	return self.health_regen_pct
end

function modifier_item_undying_heart:GetModifierEvasion_Constant()
	return self.bonus_evasion
end

function modifier_item_undying_heart:GetModifierStatusResistanceStacking()
	return self.status_resistance
end

modifier_item_undying_heart_buff=class({})


function modifier_item_undying_heart_buff:IsHidden() 			
    return false 
end

function modifier_item_undying_heart_buff:IsPurgable() 		
    return true
end

function modifier_item_undying_heart_buff:IsPurgeException() 
    return true 
end

function modifier_item_undying_heart_buff:GetTexture()
    return "item_undying_heart" 
end

function modifier_item_undying_heart_buff:CheckState() 
    return 
    {
        [MODIFIER_STATE_ALLOW_PATHING_THROUGH_CLIFFS] = true,
        [MODIFIER_STATE_NO_UNIT_COLLISION] = true,
    } 
end


function modifier_item_undying_heart_buff:DeclareFunctions() 
    return 
    {
        MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
    } 
end

function modifier_item_undying_heart_buff:OnCreated()
    if self:GetAbility() == nil then
		return
	end
	self.parent = self:GetParent()
	local hpr1 = self.parent:GetMaxHealth()*0.1
    self.active_hpregen=hpr1+self:GetAbility():GetSpecialValueFor("active_hpregen")
end

function modifier_item_undying_heart_buff:GetModifierConstantHealthRegen() 
        return self.active_hpregen
end