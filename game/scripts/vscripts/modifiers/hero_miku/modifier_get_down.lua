modifier_get_down = class({})

--------------------------------------------------------------------------------
-- Classifications
function modifier_get_down:IsHidden()
	return false
end

function modifier_get_down:IsDebuff()
	return false
end

function modifier_get_down:IsPurgable()
	return false
end

--------------------------------------------------------------------------------
-- Initializations
function modifier_get_down:OnCreated( kv )
	-- references
	self.damage = self:GetAbility():GetSpecialValueFor( "dance_damage" ) -- special value
	self.radius = self:GetAbility():GetSpecialValueFor( "dance_radius" ) -- special value
	self.interval = self:GetAbility():GetSpecialValueFor( "attack_interval" )

	if IsServer() then
		-- initialize
		self.active = true
		self.damageTable = {
			-- victim = target,
			attacker = self:GetParent(),
			damage = self.damage,
			damage_type = DAMAGE_TYPE_MAGICAL,
			ability = self:GetAbility(), --Optional.
		}

		-- Start interval
		self:StartIntervalThink( self.interval )
		self:OnIntervalThink()

		-- start effects
		self:PlayEffects( self.radius )
	end
end

function modifier_get_down:OnRefresh( kv )
	-- references
	self.damage = self:GetAbility():GetSpecialValueFor( "dance_damage" ) -- special value
	self.radius = self:GetAbility():GetSpecialValueFor( "dance_radius" ) -- special value

	if IsServer() then
		-- initialize
		self.damageTable.damage = self.damage
		self.active = kv.start
		self:SetDuration( kv.duration, true )
	end
end

function modifier_get_down:OnDestroy( kv )
	if IsServer() then
		-- stop effects
		self:StopEffects()
	end
end

--------------------------------------------------------------------------------
-- Modifier Effects


--------------------------------------------------------------------------------
-- Status Effects


--------------------------------------------------------------------------------
-- Interval Effects
function modifier_get_down:OnIntervalThink()
	if self.active==0 then return end
	local caster = self:GetCaster()

	-- find enemies
	local enemies = FindUnitsInRadius(
		self:GetParent():GetTeamNumber(),	-- int, your team number
		self:GetParent():GetOrigin(),	-- point, center point
		nil,	-- handle, cacheUnit. (not known)
		self.radius,	-- float, radius. or use FIND_UNITS_EVERYWHERE
		DOTA_UNIT_TARGET_TEAM_ENEMY,	-- int, team filter
		DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,	-- int, type filter
		0,	-- int, flag filter
		0,	-- int, order filter
		false	-- bool, can grow cache
	)

	-- damage enemies
	for _,enemy in pairs(enemies) do
		self.damageTable.victim = enemy
		ApplyDamage( self.damageTable )
        caster:AddNewModifier(caster, self, "modifier_tidehunter_anchor_smash_caster", {})
		caster:PerformAttack (
		enemy,
		true,
		true,
		true,
		false,
		true,
		false,
		true
		)
        caster:RemoveModifierByName("modifier_tidehunter_anchor_smash_caster")

	end

	-- effects: reposition cloud
	if self.effect_cast then
		ParticleManager:SetParticleControl( self.effect_cast, 0, self:GetParent():GetOrigin() )
	end
end

--------------------------------------------------------------------------------
-- Graphics & Animations
function modifier_get_down:PlayEffects( radius )
	local caster = self:GetCaster()
	if caster:HasModifier("modifier_miku_arcana") then
		if caster:HasModifier("modifier_chibi_monster") then
		self.sound_cast = "miku.6_calne_ult"
		else
		self.sound_cast = "miku.6_calne_base"
		end
	self.particle_cast = "particles/get_down_calne.vpcf"

	else
	self.particle_cast = "particles/get_down.vpcf"
	self.sound_cast = "miku.6"
	end

	-- Create Particle
	self.effect_cast = ParticleManager:CreateParticle( self.particle_cast, PATTACH_WORLDORIGIN, nil )
	ParticleManager:SetParticleControl( self.effect_cast, 0, self:GetParent():GetOrigin() )
	ParticleManager:SetParticleControl( self.effect_cast, 1, Vector( radius, radius, radius ) )

	-- Create Sound
	EmitSoundOn( self.sound_cast, self:GetParent() )
end

function modifier_get_down:StopEffects()
	-- Stop particles
	ParticleManager:DestroyParticle( self.effect_cast, false )
	ParticleManager:ReleaseParticleIndex( self.effect_cast )

	-- Stop sound
	local sound_cast = ""
	StopSoundOn( "miku.6", self:GetParent() )
	StopSoundOn( "miku.6_calne_base", self:GetParent() )
	StopSoundOn( "miku.6_calne_ult", self:GetParent() )

end
