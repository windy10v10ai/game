yukari_mass_tp = class({})
LinkLuaModifier( "modifier_yukari_tp", "modifiers/modifier_yukari_tp", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier("modifier_yukari_muted", "heroes/yukari_moon_portal", LUA_MODIFIER_MOTION_NONE)
--------------------------------------------------------------------------------
-- Ability Start
function yukari_mass_tp:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()

	-- load data
	local radius = self:GetSpecialValueFor("radius")
	local duration = self:GetSpecialValueFor("silence_duration")
	local damage = self:GetSpecialValueFor("damage")

	-- logic
	local enemies = FindUnitsInRadius(
		caster:GetTeamNumber(),	-- int, your team number
		caster:GetOrigin(),	-- point, center point
		nil,	-- handle, cacheUnit. (not known)
		radius,	-- float, radius. or use FIND_UNITS_EVERYWHERE
		DOTA_UNIT_TARGET_TEAM_ENEMY,	-- int, team filter
		DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,	-- int, type filter
		0,	-- int, flag filter
		0,	-- int, order filter
		false	-- bool, can grow cache
	)

	-- precache damage
	local damageTable = {
		-- victim = target,
		attacker = caster,
		damage = damage,
		damage_type = DAMAGE_TYPE_MAGICAL,
		ability = self, --Optional.
		damage_flags = DOTA_DAMAGE_FLAG_NONE, --Optional.
	}
	for _,enemy in pairs(enemies) do
		-- damage
		damageTable.victim = enemy
		ApplyDamage(damageTable)

		enemy:AddNewModifier(
			caster, -- player source
			self, -- ability source
			"modifier_yukari_muted", -- modifier name
			{ duration = duration + 0.5 } -- kv
		)
		enemy:AddNewModifier(
			caster, -- player source
			self, -- ability source
			"modifier_yukari_tp", -- modifier name
			{ duration = duration } -- kv
		)
	end

	self:PlayEffects( radius )
end

function yukari_mass_tp:PlayEffects( radius )
	local particle_cast = "particles/yukari_mass_tp.vpcf"
	local sound_cast = "yukari_mass_tp"

	-- Create Particle
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_WORLDORIGIN, self:GetCaster() )
	ParticleManager:SetParticleControl( effect_cast, 0, self:GetCaster():GetOrigin() )
	ParticleManager:SetParticleControl( effect_cast, 1, Vector( radius, radius, radius ) )
	ParticleManager:ReleaseParticleIndex( effect_cast )

	EmitSoundOnLocationWithCaster( self:GetCaster():GetOrigin(), sound_cast, self:GetCaster() )
end