void_spirit_dissimilate_lua = class({})
LinkLuaModifier( "modifier_void_spirit_dissimilate_lua", "modifiers/modifier_void_spirit_dissimilate_lua", LUA_MODIFIER_MOTION_NONE )

--------------------------------------------------------------------------------
-- Ability Start
function void_spirit_dissimilate_lua:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()

	-- load data
	local duration = self:GetSpecialValueFor( "phase_duration" )

	-- add modifier
	caster:AddNewModifier(
		caster, -- player source
		self, -- ability source
		"modifier_void_spirit_dissimilate_lua", -- modifier name
		{ duration = duration } -- kv
	)

	-- Play sound
	local sound_cast = "yukari.portal.out"
	EmitSoundOn( sound_cast, self:GetCaster() )
end