yukari_train = class({})


function yukari_train:OnUpgrade()
    local ability = self:GetCaster():FindAbilityByName("yukari_twin_trains")
    if ability and ability:GetLevel() < self:GetLevel() then
        ability:SetLevel(self:GetLevel())
    end
end
function yukari_train:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()
	local target = self:GetCursorTarget()
	local point = self:GetCursorPosition() + (caster:GetForwardVector() * 1)

	if target then
		point = target:GetOrigin()
	end

	-- load data
	local projectile_name = "particles/yukari_train.vpcf"
	local projectile_distance = self:GetSpecialValueFor( "dragon_slave_distance" )
	local projectile_speed = self:GetSpecialValueFor( "dragon_slave_speed" )
	local projectile_start_radius = self:GetSpecialValueFor( "dragon_slave_width_initial" )
	local projectile_end_radius = self:GetSpecialValueFor( "dragon_slave_width_end" )

	-- get direction
	local direction = point-caster:GetOrigin()
	direction.z = 0
	local projectile_direction = direction:Normalized()

	-- create projectile
	local info = {
		Source = caster,
		Ability = self,
		vSpawnOrigin = caster:GetAbsOrigin(),
		
	    bDeleteOnHit = false,
	    
	    iUnitTargetTeam = DOTA_UNIT_TARGET_TEAM_ENEMY,
	    iUnitTargetFlags = DOTA_UNIT_TARGET_FLAG_NONE,
	    iUnitTargetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
	    
	    EffectName = projectile_name,
	    fDistance = projectile_distance,
	    fStartRadius = projectile_start_radius,
	    fEndRadius = projectile_end_radius,
		vVelocity = projectile_direction * projectile_speed,

		bProvidesVision = false,
	}
	ProjectileManager:CreateLinearProjectile(info)

	-- Play effects
	if self:GetCaster():HasModifier( "modifier_item_ultimate_scepter" ) then
	EmitSoundOn( "i.like.trains", caster ) 
	EmitSoundOn( "yukari.train", caster ) 
	else
	EmitSoundOn( "yukari.train", caster ) 
	end
	
	
	self:PlayEffects1( caster, radius, debuffDuration )
	
end

--------------------------------------------------------------------------------
-- Projectile
function yukari_train:OnProjectileHitHandle( target, location, projectile )
	if not target then return end
    local caster= self:GetCaster()
	-- apply damage
		self.damage1= caster:GetIntellect()
	local damageTable = {
		victim = target,
		attacker = self:GetCaster(),
		damage = self:GetAbilityDamage()+self.damage1*self:GetSpecialValueFor( "intelligence" ),
		damage_type = self:GetAbilityDamageType(),
		ability = self, --Optional.
	}
	ApplyDamage( damageTable )

	-- get direction
	local direction = ProjectileManager:GetLinearProjectileVelocity( projectile )
	direction.z = 0
	direction = direction:Normalized()

	-- play effects
	self:PlayEffects( target, direction )
end
function yukari_train:PlayEffects1( caster, radius, duration )
	-- Get Resources
	local particle_cast = "particles/yukari_portal3.vpcf"
	local sound_cast = ""

	-- Create Particle
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, caster )
	ParticleManager:ReleaseParticleIndex( effect_cast )

	-- Create Sound
	
end

--------------------------------------------------------------------------------
function yukari_train:PlayEffects( target, direction )
	-- Get Resources
	local particle_cast = "particles/units/heroes/hero_lina/lina_spell_dragon_slave_impact.vpcf"

	-- Create Particle
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, target )
	ParticleManager:SetParticleControlForward( effect_cast, 1, direction )
	ParticleManager:ReleaseParticleIndex( effect_cast )
end

