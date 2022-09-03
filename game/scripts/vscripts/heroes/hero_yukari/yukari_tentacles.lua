yukari_tentacles = class({})
LinkLuaModifier( "modifier_yukari_tentacles", "heroes/yukari_tentacles", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_yukari_umb", "heroes/yukari_tp", LUA_MODIFIER_MOTION_NONE )
--------------------------------------------------------------------------------
-- Custom KV
-- AOE Radius
function yukari_tentacles:GetAOERadius()
	return self:GetSpecialValueFor( "radius" )
end
--function yukari_tentacles:OnUpgrade()
  --  local ability = self:GetCaster():FindAbilityByName("ability_thdots_yukari04")
   -- if ability and ability:GetLevel() < self:GetLevel() then
    --    ability:SetLevel(self:GetLevel())
   -- end
--end
function yukari_tentacles:GetIntrinsicModifierName()
    return "modifier_yukari_umb"
end
function yukari_tentacles:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()
	local point = self:GetCursorPosition()

	-- load data
	local duration = self:GetSpecialValueFor( "duration" )
	

	-- create thinker
	CreateModifierThinker(
		caster, -- player source
		self, -- ability source
		"modifier_yukari_tentacles", -- modifier name
		{ duration = duration }, -- kv
		point,
		caster:GetTeamNumber(),
		false
	)
end




modifier_yukari_tentacles = class({})

--------------------------------------------------------------------------------
-- Classifications
function modifier_yukari_tentacles:IsHidden()
	return false
end

function modifier_yukari_tentacles:IsDebuff()
	return true
end

function modifier_yukari_tentacles:IsStunDebuff()
	return false
end

function modifier_yukari_tentacles:IsPurgable()
	return false
end

--------------------------------------------------------------------------------
-- Initializations
function modifier_yukari_tentacles:OnCreated( kv )
	-- references
	local interval = self:GetAbility():GetSpecialValueFor( "tick_rate" )
	local caster = self:GetCaster()
	--local damage = self:GetAbility():GetSpecialValueFor( "damage" ) + self:GetCaster():FindTalentValue("special_bonus_yukari_25")
	local damage = self:GetAbility():GetSpecialValueFor( "damage" )+caster:GetIntellect()*self:GetAbility():GetSpecialValueFor( "intelligence" )+ self:GetCaster():FindTalentValue("special_bonus_yukari_25")
	--self.damage2=caster:GetIntellect()*self:GetAbility():GetSpecialValueFor( "intelligence" )
	--self.damage3=damage + self.damage2
	local caster = self:GetCaster()
	self.armor = self:GetAbility():GetSpecialValueFor( "root" )
	self.radius = self:GetAbility():GetSpecialValueFor( "radius" )

	self.thinker = kv.isProvidedByAura~=1

	if not IsServer() then return end
	if not self.thinker then return end
	
	

	-- precache damage
		self.damageTable = {
		victim = target,
		attacker = self:GetCaster(),
		damage = damage,
		damage_type = self:GetAbility():GetAbilityDamageType(),
		ability = self:GetAbility(), --Optional.
	}
	-- ApplyDamage(damageTable)

	-- Start interval
	self:StartIntervalThink( interval )

	-- precache effects
	self.sound_cast = "yukari.tentacles"

	-- Play effects
	self:PlayEffects()
end

function modifier_yukari_tentacles:OnRefresh( kv )
	
end

function modifier_yukari_tentacles:OnRemoved()
end

function modifier_yukari_tentacles:OnDestroy()
	if not IsServer() then return end
	if not self.thinker then return end

	UTIL_Remove( self:GetParent() )
end

--------------------------------------------------------------------------------
-- Modifier Effects
function modifier_yukari_tentacles:CheckState()
	local state = {
		[MODIFIER_STATE_INVISIBLE] = false,
	
		
		
	}

	return state
end
function modifier_yukari_tentacles:DeclareFunctions()
local func = {
 MODIFIER_PROPERTY_FIXED_DAY_VISION,
 MODIFIER_PROPERTY_FIXED_NIGHT_VISION,
 MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
 }
 return func
end
function modifier_yukari_tentacles:GetModifierMoveSpeedBonus_Percentage()
	return self.armor
end
function modifier_yukari_tentacles:GetFixedNightVision()
	return 600
end
function modifier_yukari_tentacles:GetFixedDayVision()
	return 600
end


--------------------------------------------------------------------------------
-- Interval Effects
function modifier_yukari_tentacles:OnIntervalThink()
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

	for _,enemy in pairs(enemies) do
		-- damage
		self.damageTable.victim = enemy
		ApplyDamage( self.damageTable )

		-- play effects
		EmitSoundOn( self.sound_cast, enemy )
	end
end

--------------------------------------------------------------------------------
-- Aura Effects
function modifier_yukari_tentacles:IsAura()
	return self.thinker
end

function modifier_yukari_tentacles:GetModifierAura()
	return "modifier_yukari_tentacles"
end

function modifier_yukari_tentacles:GetAuraRadius()
	return self.radius
end

function modifier_yukari_tentacles:GetAuraDuration()
	return 0.5
end

function modifier_yukari_tentacles:GetAuraSearchTeam()
	return DOTA_UNIT_TARGET_TEAM_ENEMY
end

function modifier_yukari_tentacles:GetAuraSearchType()
	return DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC
end

function modifier_yukari_tentacles:GetAuraSearchFlags()
	return 0
end

--------------------------------------------------------------------------------
-- Graphics & Animations
function modifier_yukari_tentacles:GetEffectName()
	return ""
end

function modifier_yukari_tentacles:GetEffectAttachType()
	return PATTACH_ABSORIGIN_FOLLOW
end

function modifier_yukari_tentacles:PlayEffects()
	-- Get Resources
	local particle_cast = "particles/yukari_tentacles_base.vpcf"
	local sound_cast = "yukari.tentacles_cast"

	-- Create Particle
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, self:GetParent() )
	ParticleManager:SetParticleControl( effect_cast, 0, self:GetParent():GetOrigin() )
	ParticleManager:SetParticleControl( effect_cast, 1, Vector( self.radius, 1, 1 ) )

	-- buff particle
	self:AddParticle(
		effect_cast,
		false, -- bDestroyImmediately
		false, -- bStatusEffect
		-1, -- iPriority
		false, -- bHeroEffect
		false -- bOverheadEffect
	)

	-- Create Sound
	EmitSoundOn( sound_cast, self:GetParent() )
end
