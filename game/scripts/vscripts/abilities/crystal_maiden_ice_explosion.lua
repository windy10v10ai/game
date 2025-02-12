crystal_maiden_ice_explosion = class({})

--被动
function crystal_maiden_ice_explosion:GetIntrinsicModifierName()
	return "modifier_crystal_maiden_ice_explosion"
end
--预载特效
function crystal_maiden_ice_explosion:Precache(context)
	PrecacheResource( "particle", "particles/units/heroes/hero_crystalmaiden/maiden_freezing_field_explosion_2.vpcf", context )
	PrecacheResource( "particle", "particles/econ/items/crystal_maiden/crystal_maiden_maiden_of_icewrack/maiden_freezing_field_explosion_arcana1.vpcf", context )
end
--------------------------------------------------------------------------------------------------
modifier_crystal_maiden_ice_explosion = class({})
LinkLuaModifier("modifier_crystal_maiden_ice_explosion", "abilities/crystal_maiden_ice_explosion", LUA_MODIFIER_MOTION_NONE)
-- 隐藏
function  modifier_crystal_maiden_ice_explosion:IsHidden()return true end
--函数声明
function modifier_crystal_maiden_ice_explosion:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_EVENT_ON_ATTACK
	}
	return funcs
end
--攻速
function  modifier_crystal_maiden_ice_explosion:GetModifierAttackSpeedBonus_Constant()
	return self:GetAbility():GetSpecialValueFor("attack_speed")
end
--当攻击
function  modifier_crystal_maiden_ice_explosion:OnAttack(keys)
	if IsServer() and keys.attacker == self:GetParent() and RandomInt(1,100) <=35 then
		--特效
		local Particle =  ParticleManager:CreateParticle("particles/units/heroes/hero_crystalmaiden/maiden_freezing_field_explosion_2.vpcf",8,self:GetCaster())
		local pos = self:GetCaster():GetOrigin()+RandomVector(RandomInt(0,400))
		ParticleManager:SetParticleControl( Particle,0,pos)
		ParticleManager:ReleaseParticleIndex(Particle)
		
		Particle =  ParticleManager:CreateParticle("particles/econ/items/crystal_maiden/crystal_maiden_maiden_of_icewrack/maiden_freezing_field_explosion_arcana1.vpcf",8,self:GetCaster())
		ParticleManager:SetParticleControl( Particle,0,pos)
		ParticleManager:ReleaseParticleIndex(Particle)
		
		--声音
		EmitSoundOnLocationWithCaster(pos,"Hero_Winter_Wyvern.SplinterBlast.Splinter",self:GetCaster())
		
		--搜寻单位
		local caster = self:GetCaster()
		local units = FindUnitsInRadius(caster:GetTeamNumber(),pos,nil,200,DOTA_UNIT_TARGET_TEAM_ENEMY,DOTA_UNIT_TARGET_BASIC+1,48,FIND_ANY_ORDER,false)
		for k,v in pairs(units)do
			v:AddNewModifier(caster,self:GetAbility(),"modifier_crystal_maiden_ice_explosion_slow",{duration=1})
			--造成伤害
			local damage = self:GetAbility():GetSpecialValueFor("damage")+self:GetCaster():GetAverageTrueAttackDamage(nil)*self:GetAbility():GetSpecialValueFor("ad")
			local damageInfo ={victim = v,attacker = caster,damage = damage,damage_type = DAMAGE_TYPE_MAGICAL,ability = self:GetAbility()}
			ApplyDamage( damageInfo )
		end
	end
end

--------------------------------------------------------------------------------------------------
modifier_crystal_maiden_ice_explosion_slow = class({})
LinkLuaModifier("modifier_crystal_maiden_ice_explosion_slow", "abilities/crystal_maiden_ice_explosion", LUA_MODIFIER_MOTION_NONE)
--函数声明
function modifier_crystal_maiden_ice_explosion_slow:DeclareFunctions()
	local funcs = 
	{
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
	}
	return funcs
end
--移速
function modifier_crystal_maiden_ice_explosion_slow:GetModifierMoveSpeedBonus_Percentage()
	return -50
end