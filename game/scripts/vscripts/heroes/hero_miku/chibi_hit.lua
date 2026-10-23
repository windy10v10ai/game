chibi_hit = class({})

--------------------------------------------------------------------------------
-- Custom KV


--------------------------------------------------------------------------------
-- Ability Start
function chibi_hit:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()
	local target = self:GetCursorTarget()

	-- check dragon modifier
	local modifier = caster:FindModifierByNameAndCaster( "modifier_dragon_knight_elder_dragon_form_lua", caster )

	-- check if simple form
	if not modifier then
		-- cancel if linken


		-- directly hit
		self:Hit( target, false )

		-- play effects
		local sound_cast = ""
		EmitSoundOn( sound_cast, caster )
		return
	end

	-- dragon form

	-- get data
	local projectile_name = "particles/miku_leek_projectile.vpcf"
	local projectile_speed = self:GetSpecialValueFor( "projectile_speed" )

	-- create projectile
	local info = {
		Target = target,
		Source = caster,
		Ability = self,
		iSourceAttachment = DOTA_PROJECTILE_ATTACHMENT_ATTACK_2,

		EffectName = projectile_name,
		iMoveSpeed = projectile_speed,
		bDodgeable = true,                           -- Optional
		}
	ProjectileManager:CreateTrackingProjectile(info)
end

-- Helper
function chibi_hit:Hit( target, dragonform )
	local caster = self:GetCaster()

	-- cancel if linken


	-- load data
	local damage = self:GetAbilityDamage()
	local duration = self:GetSpecialValueFor( "stun_duration" )

	-- damage
	local damageTable = {
		victim = target,
		attacker = caster,
		damage = damage,
		damage_type = self:GetAbilityDamageType(),
		ability = self, --Optional.
	}
	ApplyDamage(damageTable)

	-- stun
	local duration = duration * (1 - target:GetStatusResistance())
	target:AddNewModifier(
		caster, -- player source
		self, -- ability source
		"modifier_stunned", -- modifier name
		{ duration = duration } -- kv
	)

	-- Play effects
	self:PlayEffects( target, dragonform )
	if caster:HasModifier("modifier_miku_arcana") then
		local sound_cast = "miku.strike_arcana"
		EmitSoundOn( sound_cast, target )
	else
		local sound_cast = "miku.5_5.3d"
		EmitSoundOn( sound_cast, target )
	end
end

--------------------------------------------------------------------------------
-- Projectile
function chibi_hit:OnProjectileHit( target, location )
	if not target then return end

	self:Hit( target, true )
end

--------------------------------------------------------------------------------
function chibi_hit:PlayEffects( target, dragonform )
	local particle_name = "particles/miku_notes1.vpcf"
	if self:GetCaster():HasModifier("modifier_miku_arcana") then
		particle_name = "particles/miku_calne_notes.vpcf"
	end

	-- 音符特效是持续发射的，命中后短暂播放即销毁
	local effect_cast = ParticleManager:CreateParticle( particle_name, PATTACH_ABSORIGIN_FOLLOW, target )
	Timers:CreateTimer( 1.0, function()
		ParticleManager:DestroyParticle( effect_cast, false )
		ParticleManager:ReleaseParticleIndex( effect_cast )
	end )
end
