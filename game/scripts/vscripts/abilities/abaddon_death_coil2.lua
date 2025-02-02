abaddon_death_coil2 = class({})

--------------------------------------------------------------------------------
function abaddon_death_coil2:OnSpellStart()
	EmitSoundOn( "Hero_Abaddon.DeathCoil.Cast", self:GetCaster() )
	
	--追踪投射物
	local info = {
		Target = self:GetCursorTarget(),
		Source = self:GetCaster(),
		Ability = self,
		EffectName = "particles/econ/items/abaddon/abaddon_alliance/abaddon_death_coil_alliance.vpcf",
		iMoveSpeed = 1300,
		-- vSourceLoc = caster:GetOrigin(),
	}
	ProjectileManager:CreateTrackingProjectile( info )
end

function abaddon_death_coil2:OnProjectileHit(target,pos)
	EmitSoundOnLocationWithCaster( pos,"Hero_Abaddon.DeathCoil.Target",self:GetCaster() )
	--搜寻单位
	local caster = self:GetCaster()
	local units = FindUnitsInRadius(caster:GetTeamNumber(),pos,nil,self:GetSpecialValueFor("radius"),DOTA_UNIT_TARGET_TEAM_BOTH,DOTA_UNIT_TARGET_BASIC+1,48,FIND_ANY_ORDER,false)
	for k,v in pairs(units)do
		--治疗
		local heal = self:GetSpecialValueFor("heal") + self:GetCaster():GetAverageTrueAttackDamage(nil)*self:GetSpecialValueFor("ad")
		v:Heal(heal,self)
		SendOverheadEventMessage(nil,OVERHEAD_ALERT_HEAL,v,heal,nil)
		if v:GetTeam() ~= caster:GetTeam() then
			--添加buff
			v:AddNewModifier(self:GetCaster(),self,"modifier_abaddon_death_coil2_debuff",{duration=self:GetSpecialValueFor("duration")})
		end
	end
end
function abaddon_death_coil2:Precache(context)
	PrecacheResource( "particle", "particles/units/heroes/hero_witchdoctor/witchdoctor_maledict_aoe.vpcf", context )
end

--------------------------------------------------------------------------------------------------
--buff注册
modifier_abaddon_death_coil2_debuff = class({})
LinkLuaModifier("modifier_abaddon_death_coil2_debuff", "abilities/abaddon_death_coil2", LUA_MODIFIER_MOTION_NONE)
-- 无法驱散
function  modifier_abaddon_death_coil2_debuff:IsPurgable()return false end
--特效
function modifier_abaddon_death_coil2_debuff:GetEffectName()
	return "particles/units/heroes/hero_shadow_demon/shadow_demon_soul_catcher_debuff_v3_icon.vpcf"
end
--当创建
function modifier_abaddon_death_coil2_debuff:OnCreated()
	if not IsServer() then return end
	-- print("buff初始化")
	self.damage = self:GetAbility():GetSpecialValueFor("heal") + self:GetCaster():GetAverageTrueAttackDamage(nil)*self:GetAbility():GetSpecialValueFor("ad")*2
	self:StartIntervalThink(1)
end
--thinker
function modifier_abaddon_death_coil2_debuff:OnIntervalThink()
	if self:GetParent():GetHealth() <= self.damage then
		self:Destroy()
	end
end
--当刷新
function modifier_abaddon_death_coil2_debuff:OnRefresh()
	if not IsServer() then return end
	self.damage = self.damage + self:GetAbility():GetSpecialValueFor("heal") + self:GetCaster():GetAverageTrueAttackDamage(nil)*self:GetAbility():GetSpecialValueFor("ad")*2
end
--当销毁
function modifier_abaddon_death_coil2_debuff:OnDestroy()
	if not IsServer() then return end
	EmitSoundOn( "Hero_WitchDoctor.Maledict_Tick", self:GetParent() )

	local Particle =  ParticleManager:CreateParticle("particles/units/heroes/hero_witchdoctor/witchdoctor_maledict_aoe.vpcf",0,self:GetParent())
	ParticleManager:SetParticleControl( Particle,1, Vector(100,0,0 ) )
	--造成伤害
	local damageInfo ={victim = self:GetParent(),attacker = self:GetAbility():GetCaster(),damage = self.damage,damage_type = DAMAGE_TYPE_PURE,ability = self:GetAbility()}
	ApplyDamage( damageInfo )
end


