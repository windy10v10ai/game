ancient_apparition_frost_seal = class({})

function ancient_apparition_frost_seal:OnSpellStart()
	EmitSoundOn( "Hero_Winter_Wyvern.ColdEmbrace", self:GetCaster() )
	--添加buff
	self:GetCaster():AddNewModifier(self:GetCaster(),self,"modifier_ancient_apparition_frost_seal",{duration=4})
	self:GetCaster():AddNewModifier(self:GetCaster(),self,"modifier_ancient_apparition_frost_seal_aura",{duration=4})
end

--预载特效
function ancient_apparition_frost_seal:Precache(context)
	PrecacheResource( "particle", "particles/econ/items/crystal_maiden/crystal_maiden_cowl_of_ice/maiden_crystal_nova_cowlofice.vpcf", context )
	PrecacheResource( "particle", "particles/units/heroes/hero_lich/lich_ice_spire_debuff.vpcf", context )
end
--牵引光环
-----------------------------------------------------------------------------------------------------------------------
modifier_ancient_apparition_frost_seal_aura = class({})
LinkLuaModifier("modifier_ancient_apparition_frost_seal_aura", "abilities/ancient_apparition_frost_seal", LUA_MODIFIER_MOTION_NONE)
-- 隐藏
function  modifier_ancient_apparition_frost_seal_aura:IsHidden()return true end
-- 无法驱散
function  modifier_ancient_apparition_frost_seal_aura:IsPurgable()return false end

--特效
function modifier_ancient_apparition_frost_seal_aura:GetEffectName()
	return "particles/units/heroes/hero_lich/lich_ice_spire_victimb_2.vpcf"
end
--当销毁
function modifier_ancient_apparition_frost_seal_aura:OnDestroy(keys)
	if not IsServer() then return end
	EmitSoundOn( "Hero_Crystal.CrystalNova.Yulsaria", self:GetCaster() )
	-- EmitSoundOn( "Hero_Winter_Wyvern.SplinterBlast.Splinter", self:GetCaster() )
	
	local particle = ParticleManager:CreateParticle("particles/econ/items/crystal_maiden/crystal_maiden_cowl_of_ice/maiden_crystal_nova_cowlofice.vpcf",0,self:GetParent())
	ParticleManager:SetParticleControl( particle,1,Vector(1,1,1000))
	
	--搜寻单位
	local caster = self:GetCaster()
	local units = FindUnitsInRadius(caster:GetTeamNumber(),caster:GetOrigin(),nil,400,DOTA_UNIT_TARGET_TEAM_ENEMY,DOTA_UNIT_TARGET_BASIC+1,48,FIND_ANY_ORDER,false)
	for k,v in pairs(units)do
		v:AddNewModifier(caster,self:GetAbility(),"modifier_stunned",{duration=self:GetAbility():GetSpecialValueFor("stun_duration")})
		--造成伤害
		local damageInfo ={victim = v,attacker = caster,damage = self:GetAbility():GetSpecialValueFor("damage"),damage_type = DAMAGE_TYPE_MAGICAL,ability = self:GetAbility()}
		ApplyDamage( damageInfo )
	end
end
--光环范围
function  modifier_ancient_apparition_frost_seal_aura:GetAuraRadius() return 400 end
function  modifier_ancient_apparition_frost_seal_aura:GetAuraDuration() return 0 end
--是光环
function  modifier_ancient_apparition_frost_seal_aura:IsAura() return true end
--光环buff
function  modifier_ancient_apparition_frost_seal_aura:GetModifierAura() return "modifier_ancient_apparition_frost_seal_move" end
--光环对象
function  modifier_ancient_apparition_frost_seal_aura:GetAuraSearchTeam() return DOTA_UNIT_TARGET_TEAM_ENEMY end
function  modifier_ancient_apparition_frost_seal_aura:GetAuraSearchType() return DOTA_UNIT_TARGET_BASIC+1 end
function  modifier_ancient_apparition_frost_seal_aura:GetAuraSearchFlags() return 48 end
-----------------------------------------------------------------------------------------------------------------------
modifier_ancient_apparition_frost_seal_move = class({})
LinkLuaModifier("modifier_ancient_apparition_frost_seal_move", "abilities/ancient_apparition_frost_seal", LUA_MODIFIER_MOTION_NONE)
--当创建
function modifier_ancient_apparition_frost_seal_move:OnCreated(keys)
	if not IsServer() then return end
	self:StartIntervalThink(0.03)
	
	--特效
	self.particle =  ParticleManager:CreateParticle("particles/units/heroes/hero_lich/lich_ice_spire_debuff.vpcf",0,self:GetParent())
	ParticleManager:SetParticleControl( self.particle,1,self:GetCaster():GetOrigin() )
end
--当销毁
function modifier_ancient_apparition_frost_seal_move:OnDestroy(keys)
	if not IsServer() then return end
	ParticleManager:DestroyParticle( self.particle,true)
	FindClearSpaceForUnit(self:GetParent(), self:GetParent():GetOrigin(), true)
end
--think
function  modifier_ancient_apparition_frost_seal_move:OnIntervalThink()
	if CalcDistanceBetweenEntityOBB(self:GetCaster(),self:GetParent())>50 then
		local direction = (self:GetCaster():GetOrigin()-self:GetParent():GetOrigin()):Normalized()
		local pos = self:GetParent():GetOrigin() + direction * 100 * 0.03
		self:GetParent():SetOrigin( pos )
	end
end
--函数声明
function modifier_ancient_apparition_frost_seal_move:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
	}
	return funcs
end
--移速
function modifier_ancient_apparition_frost_seal_move:GetModifierMoveSpeedBonus_Percentage()
	return -20
end

--回血
-----------------------------------------------------------------------------------------------------------------------
modifier_ancient_apparition_frost_seal = class({})
LinkLuaModifier("modifier_ancient_apparition_frost_seal", "abilities/ancient_apparition_frost_seal", LUA_MODIFIER_MOTION_NONE)
-- 隐藏
function  modifier_ancient_apparition_frost_seal:IsHidden()return false end
-- 无法驱散
function  modifier_ancient_apparition_frost_seal:IsPurgable()return false end
--特效
function modifier_ancient_apparition_frost_seal:GetEffectName()
	return "particles/units/heroes/hero_winter_wyvern/wyvern_cold_embrace_buff.vpcf"
end
--状态声明
function modifier_ancient_apparition_frost_seal:CheckState()
	local state = {
		[MODIFIER_STATE_STUNNED] = true,
		[MODIFIER_STATE_FROZEN] = true,
	}
	return state
end
function modifier_ancient_apparition_frost_seal:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT,
		MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE
	}
	return funcs
end
--生命回复
function  modifier_ancient_apparition_frost_seal:GetModifierConstantHealthRegen(keys)
	return self:GetAbility():GetSpecialValueFor("hp_regen")+self:GetCaster():GetMaxHealth()*self:GetAbility():GetSpecialValueFor("hp_regen_percentage")*0.01
end
--减少
function  modifier_ancient_apparition_frost_seal:GetModifierIncomingDamage_Percentage(keys)
	return -50
end



