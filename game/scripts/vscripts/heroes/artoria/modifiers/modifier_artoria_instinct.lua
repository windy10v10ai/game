modifier_artoria_instinct = class({})


function modifier_artoria_instinct:IsHidden()
	return true
end

function modifier_artoria_instinct:RemoveOnDeath()
	return true
end

function modifier_artoria_instinct:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_REFLECT_SPELL,
		MODIFIER_PROPERTY_ABSORB_SPELL,
		MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
	}
end

function modifier_artoria_instinct:OnCreated(args)
	self.magic_res = self:GetAbility():GetSpecialValueFor("magic_res")
	self.status_res = self:GetAbility():GetSpecialValueFor("status_res")
end

function modifier_artoria_instinct:OnRefresh(args)
	self.magic_res = self:GetAbility():GetSpecialValueFor("magic_res")
	self.status_res = self:GetAbility():GetSpecialValueFor("status_res")
end

function modifier_artoria_instinct:GetModifierMagicalResistanceBonus()
	return self.magic_res
end

function modifier_artoria_instinct:GetModifierStatusResistanceStacking()
	return self.status_res
end

function modifier_artoria_instinct:GetAbsorbSpell( params )
	if IsServer() then
		-- if caster is teammate, do nothing
		if params.ability:GetCaster():GetTeamNumber() == self:GetParent():GetTeamNumber() then return end
		if self:GetAbility():IsFullyCastable() then
			-- use resources
			self:GetAbility():UseResources( false, false, true )

			self:PlayEffects( true )
			return 1
		end
	end
end

modifier_artoria_instinct.reflected_spell = nil
function modifier_artoria_instinct:GetReflectSpell( params )
	if IsServer() then
		-- if caster is teammate, do nothing
		if params.ability:GetCaster():GetTeamNumber() == self:GetParent():GetTeamNumber() then return end
		-- If unable to reflect due to the source ability
		if params.ability==nil or self.reflect_exceptions[params.ability:GetAbilityName()] then
			return 0
		end

		if self:GetAbility():IsFullyCastable() then
			-- use resources
			self.reflect = true

			-- remove previous ability
			if self.reflected_spell~=nil then
				self:GetParent():RemoveAbility( self.reflected_spell:GetAbilityName() )
			end

			-- copy the ability
			local sourceAbility = params.ability
			local selfAbility = self:GetParent():AddAbility( sourceAbility:GetAbilityName() )
			selfAbility:SetLevel( sourceAbility:GetLevel() )
			selfAbility:SetStolen( true )
			selfAbility:SetHidden( true )

			-- store the ability
			self.reflected_spell = selfAbility

			-- cast the ability
			self:GetParent():SetCursorCastTarget( sourceAbility:GetCaster() )
			selfAbility:CastAbility()

			-- play effects
			self:PlayEffects( false )
			return 1
		end
	end
end
--------------------------------------------------------------------------------
function modifier_artoria_instinct:PlayEffects( bBlock )
	-- Get Resources
	local particle_cast = ""
	local sound_cast = ""

	if bBlock then
		particle_cast = "particles/units/heroes/hero_antimage/antimage_spellshield.vpcf"
	else
		particle_cast = "particles/units/heroes/hero_antimage/antimage_spellshield_reflect.vpcf"
	end

	-- Play particles
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, self:GetParent() )
	ParticleManager:SetParticleControlEnt(
		effect_cast,
		0,
		self:GetParent(),
		PATTACH_POINT_FOLLOW,
		"attach_hitloc",
		self:GetParent():GetOrigin(), -- unknown
		true -- unknown, true
	)
	ParticleManager:ReleaseParticleIndex( effect_cast )

	-- Play sounds
	EmitSoundOn( "artoria_instinct", self:GetParent() )
end

modifier_artoria_instinct.reflect_exceptions = {
	["rubick_spell_steal"] = true,
	["shadow_shaman_shackles"] = true,
}
