yukari_dark = class({})
LinkLuaModifier( "modifier_generic_stunned_lua", "modifiers/modifier_generic_stunned_lua", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_yukari_dark_thinker", "modifiers/modifier_yukari_dark_thinker", LUA_MODIFIER_MOTION_NONE )

--------------------------------------------------------------------------------
-- Custom KV
-- AOE Radius
function yukari_dark:GetAOERadius()
	return self:GetSpecialValueFor( "radius" )
end

--------------------------------------------------------------------------------
-- Ability Start
function yukari_dark:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()
	local point = self:GetCursorPosition()

	-- load data

	-- create thinker
	CreateModifierThinker(
		caster,
		self,
		"modifier_yukari_dark_thinker",
		{},
		point,
		caster:GetTeamNumber(),
		false
	)

	-- effects
	local sound_cast = ""
	EmitSoundOn( sound_cast, caster )
end