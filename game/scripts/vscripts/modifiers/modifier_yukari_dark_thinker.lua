modifier_yukari_dark_thinker = class({})

--------------------------------------------------------------------------------
-- Classifications
function modifier_yukari_dark_thinker:IsPurgable()
	return false
end

--------------------------------------------------------------------------------
-- Initializations
function modifier_yukari_dark_thinker:OnCreated( kv )
	if IsServer() then
		-- references
		local caster=self:GetCaster()
		local delay = self:GetAbility():GetSpecialValueFor("delay")
		self.damage1= caster:GetIntellect()
		self.damage = self:GetAbility():GetSpecialValueFor("damage")+ self:GetCaster():FindTalentValue("special_bonus_yukari_20")+self.damage1*0.7
		self.radius = self:GetAbility():GetSpecialValueFor("radius")
		self.duration = self:GetAbility():GetSpecialValueFor("silence_duration")
		local vision = 200

		-- Start interval
		self:StartIntervalThink( delay )

		-- Create fow viewer
		

		EmitSoundOnLocationWithCaster( self:GetParent():GetOrigin(), "yukari.road_signs", self:GetCaster() )
		self:PlayEffects1()
	end
end

function modifier_yukari_dark_thinker:OnDestroy( kv )
	if IsServer() then
		UTIL_Remove(self:GetParent())
	end
end

--------------------------------------------------------------------------------
-- Interval Effects
function modifier_yukari_dark_thinker:OnIntervalThink()
	-- find enemies
	local enemies = FindUnitsInRadius(
		self:GetCaster():GetTeamNumber(),	-- int, your team number
		self:GetParent():GetOrigin(),	-- point, center point
		nil,	-- handle, cacheUnit. (not known)
		self.radius,	-- float, radius. or use FIND_UNITS_EVERYWHERE
		DOTA_UNIT_TARGET_TEAM_ENEMY,	-- int, team filter
		DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,	-- int, type filter
		0,	-- int, flag filter
		0,	-- int, order filter
		false	-- bool, can grow cache
	)

	local damageTable = {
		-- victim = target,
		attacker = self:GetCaster(),
		damage = self.damage,
		damage_type = DAMAGE_TYPE_MAGICAL,
		ability = self:GetAbility(), --Optional.
	}
	for _,enemy in pairs(enemies) do
		-- damage
		damageTable.victim = enemy
		ApplyDamage(damageTable)

		-- silence
		enemy:AddNewModifier(
			self:GetCaster(), -- player source
			self:GetAbility(), -- ability source
			"modifier_generic_stunned_lua", -- modifier name
			{ duration = self.duration } -- kv
		)

		-- effects
		
	end

	self:PlayEffects2()
	self:PlayEffects()
	self:Destroy()
end

--------------------------------------------------------------------------------
-- Graphics & Animations
function modifier_yukari_dark_thinker:PlayEffects1()
	-- Get Resources
	local particle_cast = "particles/yukari_darkness.vpcf"
	local sound_cast = "yukari.dark1"

	-- Create Particle
	self.effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_WORLDORIGIN, nil )
	ParticleManager:SetParticleControl( self.effect_cast, 0, self:GetParent():GetOrigin() )
	ParticleManager:SetParticleControl( self.effect_cast, 1, Vector( self.radius, self.radius, self.radius ) )
	assert(loadfile("modifiers/rubick_spell_steal_lua_color"))(self,self.effect_cast)

	-- Create Sound
	EmitSoundOnLocationWithCaster( self:GetParent():GetOrigin(), sound_cast, self:GetCaster() )
end

function modifier_yukari_dark_thinker:PlayEffects2()
	-- Get Resources
	-- local sound_cast = 

	ParticleManager:DestroyParticle( self.effect_cast, false )
	ParticleManager:ReleaseParticleIndex( self.effect_cast )

	-- Create Sound
	-- EmitSoundOnLocationWithCaster( self:GetParent():GetOrigin(), sound_cast, self:GetCaster() )
end

function modifier_yukari_dark_thinker:PlayEffects()
	-- Get Resources
	local particle_cast = "particles/yukari_road_signs.vpcf"
	local sound_cast = "yukari.road_signs_get_out"

	-- -- Create Particle
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_WORLDORIGIN, self:GetCaster() )
	ParticleManager:SetParticleControl( effect_cast, 0, self:GetParent():GetOrigin() )
	ParticleManager:SetParticleControl( effect_cast, 1, Vector( self.radius, 0, 0 ) )
	ParticleManager:ReleaseParticleIndex( effect_cast )

	-- Create Sound
	EmitSoundOnLocationWithCaster( self:GetParent():GetOrigin(), sound_cast, self:GetCaster() )
end