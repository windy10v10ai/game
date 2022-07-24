modifier_pantsushot = class({})

--------------------------------------------------------------------------------
-- Classifications
function modifier_pantsushot:IsHidden()
	-- actual true
	return true
end

function modifier_pantsushot:IsPurgable()
	return false
end
function modifier_pantsushot:AllowIllusionDuplicate()
 return false
 end

--------------------------------------------------------------------------------
-- Initializations
function modifier_pantsushot:OnCreated( kv )
	-- references
	self.crit_chance = self:GetAbility():GetSpecialValueFor( "crit_chance" )
	self.crit_bonus = self:GetAbility():GetSpecialValueFor( "crit_bonus" )
	self.stunDuration = self:GetAbility():GetSpecialValueFor( "stun_duration" )
end

function modifier_pantsushot:OnRefresh( kv )
	-- references
	self.crit_chance = self:GetAbility():GetSpecialValueFor( "crit_chance" )
	self.crit_bonus = self:GetAbility():GetSpecialValueFor( "crit_bonus" )
	self.stunDuration = self:GetAbility():GetSpecialValueFor( "stun_duration" )
end

function modifier_pantsushot:OnDestroy( kv )

end

--------------------------------------------------------------------------------
-- Modifier Effects
function modifier_pantsushot:DeclareFunctions()
	local funcs = {
		MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE,
		MODIFIER_PROPERTY_PROCATTACK_FEEDBACK,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
		MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,
	}

	return funcs
end

function modifier_pantsushot:GetModifierBaseAttackTimeConstant()
	return 1.7
end
function modifier_pantsushot:GetModifierPreAttack_CriticalStrike( params )
	if IsServer() and (not self:GetParent():PassivesDisabled()) then
	   if self:GetAbility():IsFullyCastable() then
		if self:RollChance( self.crit_chance ) and ( not self:GetParent():IsIllusion() ) then
			self.record = params.record
			local target = params.target
			self:GetAbility():StartCooldown(self:GetAbility():GetSpecialValueFor( "cooldown" ))

            -- stun the enemy
			local duration = self.stunDuration * (1 - target:GetStatusResistance())
            target:AddNewModifier(
                self:GetCaster(), -- player source
                self:GetAbility(), -- ability source
                "modifier_stunned", -- modifier name
                { duration = duration } -- kv
            )

			return self.crit_bonus
		end
	end
end
end

function modifier_pantsushot:GetModifierProcAttack_Feedback( params )
	if IsServer() then
		if self.record then
			self.record = nil
			self:PlayEffects( params.target )
		end
	end
end
--------------------------------------------------------------------------------
-- Helper
function modifier_pantsushot:RollChance( chance )
	local rand = math.random()
	if rand<chance/100 then
		return true
	end
	return false
end

--------------------------------------------------------------------------------
-- Graphics & Animations
function modifier_pantsushot:PlayEffects( target )
local caster = self:GetParent()
	if caster:HasModifier("modifier_miku_arcana") then
		self.particle_cast = "particles/miku_huya_calne.vpcf"
	else
	self.particle_cast = "particles/miku_huya.vpcf"
	end
	-- local sound_cast = "miku.2"

	-- if target:IsMechanical() then
	-- 	particle_cast = "particles/units/heroes/hero_phantom_assassin/phantom_assassin_crit_impact_mechanical.vpcf"
	-- 	sound_cast = "Hero_PhantomAssassin.CoupDeGrace.Mech"
	-- end

	-- Create Particle
	local effect_cast = ParticleManager:CreateParticle( self.particle_cast, PATTACH_ABSORIGIN_FOLLOW, target )
	ParticleManager:SetParticleControlEnt(
		effect_cast,
		0,
		target,
		PATTACH_POINT_FOLLOW,
		"attach_hitloc",
		target:GetOrigin(), -- unknown
		true -- unknown, true
	)
	ParticleManager:SetParticleControlForward( effect_cast, 1, (self:GetParent():GetOrigin()-target:GetOrigin()):Normalized() )
	ParticleManager:ReleaseParticleIndex( effect_cast )

	-- EmitSoundOn( sound_cast, target )
end
