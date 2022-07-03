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
-- function modifier_goku_spirit_bomb_tick:IsPurge() return false end
-- function modifier_goku_spirit_bomb_tick:RemoveOnDeath() return false end
-- function modifier_goku_spirit_bomb_tick:IsHidden() return true end
-- function modifier_goku_spirit_bomb_tick:OnCreated(keys)
-- 	self.radius = 0
-- 	self.particle = keys.particle
-- 	self:StartIntervalThink(0.05)
-- end

-- function modifier_goku_spirit_bomb_tick:OnIntervalThink()
-- 	self.radius = self.radius + 2.5
-- 	ParticleManager:SetParticleControl(self.particle,1,Vector(self.radius,0,0))
-- 	ParticleManager:SetParticleControl(self.particle,2,Vector(self.radius,0,0))
-- end

-- function modifier_goku_spirit_bomb_tick:OnDestroy()
-- 	ParticleManager:SetParticleControl(self.particle,2,Vector(0,0,0))
-- end



-- --------------------------------------------------------------------------------
-- -- Custom KV
-- -- AOE Radius
-- function goku_spirit_bomb:GetAOERadius()
-- 	return self:GetSpecialValueFor( "destination_radius" )
-- end

-- --------------------------------------------------------------------------------
-- -- Ability Phase Start
-- function goku_spirit_bomb:OnAbilityPhaseStart()
-- 	-- unit identifier
-- 	local caster = self:GetCaster()
-- 	local point = self:GetCursorPosition()
-- 	local vector = point-caster:GetOrigin()
-- 	vector.z = 0

-- 	-- get data
-- 	local radius = self:GetSpecialValueFor( "destination_radius" )
-- 	local height = self:GetSpecialValueFor( "starting_height" )

-- 	-- create wisp
-- 	self.wisp = CreateUnitByName(
-- 		"dummy_unit",
-- 		caster:GetOrigin(),
-- 		true,
-- 		caster,
-- 		caster:GetOwner(),
-- 		caster:GetTeamNumber()
-- 	)
-- 	self.wisp:AddNewModifier(
-- 		caster, -- player source
-- 		self, -- ability source
-- 		"modifier_goku_genkidama", -- modifier name
-- 		{} -- kv
-- 	)
-- 	self.wisp:SetForwardVector( vector:Normalized() )
-- 	self.wisp:SetOrigin( self.wisp:GetOrigin() + Vector( 0,0,height ) )

-- 	-- create effects
-- 	self:PlayEffects1( point, radius )
-- 	self:PlayEffects2()

-- 	return true -- if success
-- end
-- function goku_spirit_bomb:OnAbilityPhaseInterrupted()
-- 	UTIL_Remove( self.wisp )

-- 	self:StopEffects1()
-- 	self:StopEffects2()
-- end

-- --------------------------------------------------------------------------------
-- -- Ability Start
-- function goku_spirit_bomb:OnSpellStart()
-- 	-- unit identifier
-- 	local caster = self:GetCaster()
-- 	local point = self:GetCursorPosition()
-- 	local vector = point-caster:GetOrigin()
-- 	vector.z = 0
-- 	local origin = caster:GetOrigin()

-- 	-- load data
-- 	local height = self:GetSpecialValueFor( "starting_height" )

-- 	local projectile_name = ""
-- 	local projectile_speed = self:GetSpecialValueFor( "destination_travel_speed" )
-- 	local projectile_distance = vector:Length2D()
-- 	local projectile_direction = vector:Normalized()
-- 	local projectile_height = self:GetSpecialValueFor( "450" )

-- 	-- projectiles don't change height, so better pre-set it to have nice effect
-- 	local spawn_origin = caster:GetOrigin()
-- 	spawn_origin.z = GetGroundHeight( point, caster )
-- 	height = origin.z + height - spawn_origin.z

-- 	-- create projectile
-- 	local info = {
-- 		Source = caster,
-- 		Ability = self,
-- 		vSpawnOrigin = spawn_origin,

-- 	    bDeleteOnHit = true,

-- 	    iUnitTargetTeam = DOTA_UNIT_TARGET_TEAM_NONE,
-- 	    iUnitTargetFlags = DOTA_UNIT_TARGET_FLAG_NONE,
-- 	    iUnitTargetType = DOTA_UNIT_TARGET_NONE,

-- 	    EffectName = projectile_name,
-- 	    fDistance = projectile_distance,
-- 	    fStartRadius = 0,
-- 	    fEndRadius = 0,
-- 		vVelocity = projectile_direction * projectile_speed,

-- 		ExtraData = {
-- 			origin_x = origin.x,
-- 			origin_y = origin.y,
-- 			origin_z = origin.z,
-- 			distance = projectile_distance,
-- 			height = height,
-- 			returning = 0,
-- 		}
-- 	}
-- 	ProjectileManager:CreateLinearProjectile(info)

-- 	-- deactivate ability
-- 	self:SetActivated( true )
-- 	local ability = caster:FindAbilityByName( "dark_willow_bedlam_lua" )
-- 	if ability then ability:SetActivated( false ) end

-- end
-- --------------------------------------------------------------------------------
-- -- Projectile
-- function goku_spirit_bomb:OnProjectileHit_ExtraData( target, location, ExtraData )
-- 	local returning = ExtraData.returning==1

-- 	if returning then
-- 		-- kill the wisp
-- 		UTIL_Remove( self.wisp )

-- 		-- deactivate ability
-- 		self:SetActivated( true )
-- 		local ability = self:GetCaster():FindAbilityByName( "dark_willow_bedlam_lua" )
-- 		if ability then ability:SetActivated( true ) end
-- 		return
-- 	end

-- 	-- get data
-- 	local radius = self:GetSpecialValueFor( "destination_radius" )
-- 	local duration = self:GetSpecialValueFor( "destination_status_duration" )

-- 	-- find enemies
-- 	local enemies = FindUnitsInRadius(
-- 		self:GetCaster():GetTeamNumber(),	-- int, your team number
-- 		location,	-- point, center point
-- 		nil,	-- handle, cacheUnit. (not known)
-- 		radius,	-- float, radius. or use FIND_UNITS_EVERYWHERE
-- 		DOTA_UNIT_TARGET_TEAM_ENEMY,	-- int, team filter
-- 		DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,	-- int, type filter
-- 		0,	-- int, flag filter
-- 		0,	-- int, order filter
-- 		false	-- bool, can grow cache
-- 	)
--     local damage = self:GetSpecialValueFor( "damage" )
-- 	local damageTable = {
-- 		-- victim = target,
-- 		attacker = self:GetCaster(),
-- 		damage = damage,
-- 		damage_type = self:GetAbilityDamageType(),
-- 		ability = self, --Optional.
-- 	}
-- 	for _,enemy in pairs(enemies) do
-- 		-- add fear
-- 		damageTable.victim = enemy
-- 		ApplyDamage(damageTable)
-- 	end

-- 	-- create return projectile
-- 	local projectile_speed = self:GetSpecialValueFor( "return_travel_speed" )
-- 	local info = {
-- 		Target = self:GetCaster(),
-- 		Source = self.wisp,
-- 		Ability = self,

-- 		EffectName = projectile_name,
-- 		iMoveSpeed = projectile_speed,
-- 		bDodgeable = false,                           -- Optional

-- 		ExtraData = {
-- 			returning = 1,
-- 		}
-- 	}
-- 	ProjectileManager:CreateTrackingProjectile(info)

-- 	-- set wisp activity
-- 	self.wisp:StartGesture( ACT_DOTA_CAST_ABILITY_5 )

-- 	-- play effects
-- 	self:PlayEffects3( location, radius, #enemies )
-- end

-- function goku_spirit_bomb:OnProjectileThink_ExtraData( location, ExtraData )
-- 	local returning = ExtraData.returning==1
-- 	if returning then
-- 		-- get facing direction
-- 		local direction = location
-- 		direction.z = -10000
-- 		direction = direction:Normalized()

-- 		-- set position
-- 		self.wisp:SetOrigin( location )
-- 		self.wisp:SetForwardVector( direction )
-- 		return
-- 	end

-- 	-- get data
-- 	local origin = Vector( ExtraData.origin_x, ExtraData.origin_y, ExtraData.origin_z )
-- 	local distance = ExtraData.distance
-- 	local height = ExtraData.height

-- 	-- interpolate height
-- 	local current_dist = (location-origin):Length2D()

-- 	local current_height = height - (current_dist/distance)*height

-- 	self.wisp:SetOrigin( location + Vector( 0,0,current_height ) )
-- end

-- --------------------------------------------------------------------------------
-- function goku_spirit_bomb:PlayEffects1( point, radius )
-- 	-- Get Resources
-- 	local particle_cast = ""

-- 	-- Create Particle
-- 	-- self.effect_cast1 = ParticleManager:CreateParticleForTeam( particle_cast, PATTACH_WORLDORIGIN, nil, self:GetCaster():GetTeamNumber() )
-- 	self.effect_cast1 = assert(loadfile("modifiers/rubick_spell_steal_lua_arcana"))(self, particle_cast, PATTACH_WORLDORIGIN, nil, self:GetCaster():GetTeamNumber() )
-- 	ParticleManager:SetParticleControl( self.effect_cast1, 0, point )
-- 	ParticleManager:SetParticleControl( self.effect_cast1, 1, Vector( radius, 0, 0 ) )

-- 	-- play sound
-- 	local sound_cast1 = "goku.4"
-- 	local sound_cast2 = "goku.4_1"
-- 	local sound_cast3 = "goku.4_1"
-- 	EmitSoundOn( sound_cast1, self:GetCaster() )
-- 	EmitSoundOn( sound_cast2, self:GetCaster() )
-- 	EmitSoundOnLocationWithCaster( self:GetCaster():GetOrigin(), sound_cast3, self:GetCaster() )
-- end
-- function goku_spirit_bomb:StopEffects1()
-- 	-- destroy particle
-- 	ParticleManager:DestroyParticle( self.effect_cast1, false )
-- 	ParticleManager:ReleaseParticleIndex( self.effect_cast1 )

-- 	-- stop sound
-- 	local sound_cast1 = "goku.4"
-- 	local sound_cast2 = "goku.4_1"
-- 	local sound_cast3 = "goku.4_1"
-- 	StopSoundOn( sound_cast1, self:GetCaster() )
-- 	StopSoundOn( sound_cast2, self:GetCaster() )
-- 	StopSoundOn( sound_cast3, self:GetCaster() )
-- end

-- function goku_spirit_bomb:PlayEffects2()
-- 	-- Get Resources
-- 	local particle_cast = "particles/spirit_bomb.vpcf"

-- 	-- Create Particle
-- 	-- self.effect_cast2 = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, self.wisp )
-- 	self.effect_cast2 = assert(loadfile("modifiers/rubick_spell_steal_lua_arcana"))(self, particle_cast, PATTACH_ABSORIGIN_FOLLOW, self.wisp )
-- end
-- function goku_spirit_bomb:StopEffects2()
-- 	-- destroy particle
-- 	ParticleManager:DestroyParticle( self.effect_cast2, false )
-- 	ParticleManager:ReleaseParticleIndex( self.effect_cast2 )
-- end

-- function goku_spirit_bomb:PlayEffects3( point, radius, number )
-- 	-- Get Resources
-- 	local particle_cast = "particles/spirit_bomb_explosion.vpcf"


-- 	-- Create Particle
-- 	-- local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_WORLDORIGIN, nil )
-- 	local effect_cast = assert(loadfile("modifiers/rubick_spell_steal_lua_arcana"))(self, particle_cast, PATTACH_WORLDORIGIN, nil )
-- 	ParticleManager:SetParticleControl( effect_cast, 0, point )
-- 	ParticleManager:SetParticleControl( effect_cast, 1, Vector( radius, 0, radius*2 ) )
-- 	ParticleManager:ReleaseParticleIndex( effect_cast )

-- 	-- Create Sound

-- end
