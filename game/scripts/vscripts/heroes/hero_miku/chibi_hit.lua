chibi_hit = class({})

--------------------------------------------------------------------------------
-- Custom KV


--------------------------------------------------------------------------------
-- Ability Start
function chibi_hit:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()
	local target = self:GetCursorTarget()

	-- cancel if linken

	-- directly hit
	self:Hit( target )

	-- play effects
	local sound_cast = ""
	EmitSoundOn( sound_cast, caster )
end

--------------------------------------------------------------------------------
-- Helper
function chibi_hit:Hit( target )
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
	self:PlayEffects( target )
	if caster:HasModifier("modifier_miku_arcana") then
		local sound_cast = "miku.strike_arcana"
		EmitSoundOn( sound_cast, target )
	else
		local sound_cast = "miku.5_5.3d"
		EmitSoundOn( sound_cast, target )
	end
end

--------------------------------------------------------------------------------
function chibi_hit:PlayEffects( target )
	local particle_name = "particles/miku_notes_hit.vpcf"
	if self:GetCaster():HasModifier("modifier_miku_arcana") then
		particle_name = "particles/miku_calne_notes_hit.vpcf"
	end

	-- 音符特效是持续发射的，命中后短暂播放即销毁
	local effect_cast = ParticleManager:CreateParticle( particle_name, PATTACH_ABSORIGIN_FOLLOW, target )
	Timers:CreateTimer( 1.0, function()
		ParticleManager:DestroyParticle( effect_cast, false )
		ParticleManager:ReleaseParticleIndex( effect_cast )
	end )
end
