LinkLuaModifier( "modifier_goku_spirit_bomb_stun", "heroes/hero_goku/goku_spirit_bomb", LUA_MODIFIER_MOTION_NONE )
goku_spirit_bomb = goku_spirit_bomb or class({})
modifier_goku_spirit_bomb_stun = modifier_goku_spirit_bomb_stun or class({})

-- LinkLuaModifier( "modifier_goku_genkidama", "modifiers/hero_goku/modifier_goku_genkidama", LUA_MODIFIER_MOTION_NONE )
function goku_spirit_bomb:Spawn()
    if self:GetLevel() == 0 then
        self:SetLevel(1)
    end
end


function goku_spirit_bomb:GetAbilityTextureName()
	if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
		return "custom/goku/goku_spirit_bomb_ss"
	else
		return "custom/goku/goku_spirit_bomb"
	end
end


function goku_spirit_bomb:GetChannelTime()
    return self:GetSpecialValueFor("channel")
end


function goku_spirit_bomb:OnInventoryContentsChanged()
	if IsServer() then
		if self:GetCaster():HasModifier("modifier_item_aghanims_shard") then
			self:SetHidden(false)
		else
			self:SetHidden(true)
		end
	end
end

function goku_spirit_bomb:OnHeroCalculateStatBonus()
	self:OnInventoryContentsChanged()
end

-- function goku_spirit_bomb:OnAbilityPhaseStart()
-- 	local caster = self:GetCaster()
-- 	self.particle_bomb = ParticleManager:CreateParticle("particles/custom/goku/goku_spirit_bomb.vpcf", PATTACH_WORLDORIGIN, caster)
-- 	ParticleManager:SetParticleControl(self.particle_bomb,0,self:GetCaster():GetAbsOrigin() + Vector(0,0,400))
-- 	ParticleManager:SetParticleControl(self.particle_bomb,1,Vector(0,0,0))
-- 	ParticleManager:SetParticleControl(self.particle_bomb,2,Vector(0,0,0))
-- 	ParticleManager:SetParticleControl(self.particle_bomb,60,Vector(255,200,0))
-- 	ParticleManager:SetParticleControl(self.particle_bomb,61,Vector(255,255,255))
-- 	caster:AddNewModifier(caster,self,"modifier_goku_spirit_bomb_tick",{particle = self.particle_bomb})
-- 	return true
-- end

-- function goku_spirit_bomb:OnAbilityPhaseInterrupted()
-- 	local caster = self:GetCaster()
-- 	ParticleManager:DestroyParticle(self.particle_bomb,false)
-- 	ParticleManager:ReleaseParticleIndex(self.particle_bomb)
-- 	caster:RemoveModifierByName("modifier_goku_spirit_bomb_tick")
-- end



function goku_spirit_bomb:OnSpellStart()
	local caster = self:GetCaster()
	self.location = self:GetCursorPosition()
	self.speed = self:GetSpecialValueFor("speed")
	self.height = 500
	self.effctRadius = 0
	self.radius_max = self:GetSpecialValueFor("radius_max")
	self.damage_max = self:GetSpecialValueFor("damage_max")
	self.visionRange_max = self:GetSpecialValueFor("visionRange_max")

	self.visibler = CreateUnitByName(
		"dummy_unit",
		caster:GetAbsOrigin(),
		false,
		nil,
		nil,
		caster:GetTeamNumber()
	)

	self.damagetable =
	{
		victim = caster,
		attacker = caster,
		damage = 0,
		damage_type = DAMAGE_TYPE_MAGICAL,
		damage_flags = DOTA_DAMAGE_FLAG_NONE,
		ability = self
	}

	self.tick =  self.radius_max / self:GetChannelTime()
	self.particle_bomb = ParticleManager:CreateParticle("particles/custom/goku/goku_spirit_bomb.vpcf", PATTACH_WORLDORIGIN, caster)
	ParticleManager:SetParticleControl(self.particle_bomb,0,caster:GetAbsOrigin() + Vector(0,0,self.height))
	ParticleManager:SetParticleControl(self.particle_bomb,1,Vector(0,0,0))
	ParticleManager:SetParticleControl(self.particle_bomb,2,Vector(0,0,0))
	ParticleManager:SetParticleControl(self.particle_bomb,61,Vector(255,255,255))
	if caster:HasModifier("modifier_goku_super_saiyan") then
		ParticleManager:SetParticleControl(self.particle_bomb,60,Vector(255,255,0))
	else
		ParticleManager:SetParticleControl(self.particle_bomb,60,Vector(0,255,255))
	end

	caster:EmitSound("goku.4")
end

function goku_spirit_bomb:OnChannelThink(interval)
	local caster = self:GetCaster()
	self.effctRadius = self.effctRadius + interval * self.tick
	local visionRange = self.visionRange_max * (self.effctRadius / self.radius_max)
	self.visibler:SetAbsOrigin(caster:GetAbsOrigin())
	self.visibler:SetDayTimeVisionRange(visionRange)
	self.visibler:SetNightTimeVisionRange(visionRange)
	ParticleManager:SetParticleControl(self.particle_bomb,0,caster:GetAbsOrigin() + Vector(0,0,self.height))
	ParticleManager:SetParticleControl(self.particle_bomb,1,Vector(self.effctRadius,0,0))
	ParticleManager:SetParticleControl(self.particle_bomb,2,Vector(self.effctRadius,0,0))
end


function goku_spirit_bomb:OnChannelFinish(interrupted)
	local caster = self:GetCaster()
	if not interrupted then
		self.effctRadius = self.radius_max
		ParticleManager:SetParticleControl(self.particle_bomb,1,Vector(self.effctRadius,0,0))
	end


	if self:GetCaster():HasModifier("modifier_goku_super_saiyan") then
		self.damagetable.damage = self.damage_max
	else
		self.damagetable.damage = self.damage_max * (self.effctRadius / self.radius_max)
	end

	ParticleManager:SetParticleControl(self.particle_bomb,2,Vector(0,0,0))

	local origin = caster:GetAbsOrigin() + Vector(0,0,self.height)

	self.wisp = CreateUnitByName(
		"dummy_unit",
		self.location,
		false,
		nil,
		nil,
		caster:GetTeamNumber()
	)



	caster:StartGesture(ACT_DOTA_CAST_ABILITY_2)
	caster:AddNewModifier(caster,self,"modifier_goku_spirit_bomb_stun",{duration = 0.4})
	self.wisp:SetContextThink("CreateSpiritBombProjectile",function ()
		local projectileInfo =
		{
				Ability				= self,
				vSourceLoc			= origin,
				Target 				= self.wisp,
				iMoveSpeed		 	= self.speed,
				bVisibleToEnemies 	= true,
				bDrawsOnMinimap		= false,
				iVisionRadius		= self.effctRadius,
				iVisionTeamNumber	= caster:GetTeamNumber(),
				ExtraData =
				{
					particle_bomb = self.particle_bomb,
					radius = self.effctRadius,
					visibler = self.visibler:GetEntityIndex()
				}
		}
		ProjectileManager:CreateTrackingProjectile(projectileInfo)
	end,0.4)
end

function goku_spirit_bomb:OnProjectileThink_ExtraData(location,extraData)
	local visibler = EntIndexToHScript(extraData.visibler)
	local particle_bomb = extraData.particle_bomb
	ParticleManager:SetParticleControl(particle_bomb,0,location)
	visibler:SetAbsOrigin(location)
end

function goku_spirit_bomb:OnProjectileHit_ExtraData(target,location,extraData)
	local caster = self:GetCaster()
	local particle_bomb = extraData.particle_bomb
	local radius = extraData.radius
	local visibler = EntIndexToHScript(extraData.visibler)

	local units = FindUnitsInRadius(
		caster:GetTeamNumber(),
		target:GetAbsOrigin(),
		nil,
		radius,
		DOTA_UNIT_TARGET_TEAM_ENEMY,
		DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
		DOTA_UNIT_TARGET_FLAG_NONE,
		FIND_ANY_ORDER,
		false
	)

	target:EmitSound("goku.4_1")
	target:Destroy()
	visibler:Destroy()
	for _, unit in ipairs(units) do
		self.damagetable.victim = unit
		ApplyDamage(self.damagetable)
	end

	ParticleManager:DestroyParticle(particle_bomb,false)
	ParticleManager:ReleaseParticleIndex(particle_bomb)
end


function modifier_goku_spirit_bomb_stun:IsPurge() return false end
function modifier_goku_spirit_bomb_stun:IsHidden() return true end
function modifier_goku_spirit_bomb_stun:CheckState()
	return {[MODIFIER_STATE_STUNNED] = true}
end
