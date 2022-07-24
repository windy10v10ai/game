-----------------------------
--    Invisible Air    --
-----------------------------

artoria_strike_air = class({})

function artoria_strike_air:GetCooldown()
	return self:GetSpecialValueFor("AbilityCooldown")
end

function artoria_strike_air:OnSpellStart()
	local caster = self:GetCaster()
	local target = self:GetCursorTarget()
	local point = self:GetCursorPosition() + (caster:GetForwardVector() * 1)

	if target then
		point = target:GetOrigin()
	end

	caster:EmitSound("artoria_strike_air")

	self.bRetracting = false
	self.hVictim = nil
	self.bDiedInInvisibleAir = false

	local particleNameInvi = "particles/custom/artoria/invisible_air/artoria_invisible_air.vpcf"
	local particleName = "particles/custom/artoria/strike_air/artoria_strike_air.vpcf"
	local fxIndex = ParticleManager:CreateParticle( particleName, PATTACH_POINT , caster )
	ParticleManager:SetParticleControl( fxIndex, 3, caster:GetAbsOrigin() )


	local immunity_duration = self:GetSpecialValueFor("immunity_duration")
	caster:AddNewModifier( caster, self, "modifier_black_king_bar_immune", {Duration = immunity_duration} )

	-- get ability cast range
	local projectile_distance = self:GetSpecialValueFor("cast_range")
	local projectile_speed = self:GetSpecialValueFor("speed")
	local projectile_start_radius = self:GetSpecialValueFor("start_radius")
	local projectile_end_radius = self:GetSpecialValueFor("end_radius")

	-- get direction
	local direction = point-caster:GetOrigin()
	direction.z = 0
	local projectile_direction = direction:Normalized()

	local info = {
		Source = caster,
		Ability = self,
		vSpawnOrigin = caster:GetAbsOrigin(),

	    bDeleteOnHit = false,

	    iUnitTargetTeam = DOTA_UNIT_TARGET_TEAM_ENEMY,
	    iUnitTargetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
	    iUnitTargetFlags = DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,

	    EffectName = particleNameInvi,
	    fDistance = projectile_distance,
	    fStartRadius = projectile_start_radius,
	    fEndRadius = projectile_end_radius,
		vVelocity = projectile_direction * projectile_speed,
		fExpireTime = GameRules:GetGameTime() + 1.5,

		bProvidesVision = false,
	}
	ProjectileManager:CreateLinearProjectile(info)

	Timers:CreateTimer( 1.5, function()
		ParticleManager:DestroyParticle( fxIndex, false )
		ParticleManager:ReleaseParticleIndex( fxIndex )
	end
	)
end

function artoria_strike_air:OnProjectileHit_ExtraData(target, vLocation, tData)

	if target == nil then return end

	local caster = self:GetCaster()
	local damage = self:GetSpecialValueFor( "damage" )
	local stunDuration = self:GetSpecialValueFor( "stun_duration" )

	if caster:HasModifier("modifier_item_aghanims_shard") then
		-- perform attack target
		self:GetCaster():PerformAttack (
            target,
            true,
            true,
            true,
            false,
            false,
            false,
            true)
	end

	if target:IsMagicImmune() then
		return
	end

	local dmgtable = {
		attacker = caster,
		victim = target,
		damage = damage,
		damage_type = DAMAGE_TYPE_MAGICAL,
		damage_flags = 0,
		ability = self
	}
	ApplyDamage(dmgtable)

	local stunDuration = stunDuration * (1 - target:GetStatusResistance())
	target:AddNewModifier( caster, self, "modifier_stunned", {Duration = stunDuration} )
end
