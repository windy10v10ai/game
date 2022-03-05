get_down = class({})
LinkLuaModifier( "modifier_get_down", "modifiers/modifier_get_down", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_generic_stunned_lua", "modifiers/modifier_generic_stunned_lua", LUA_MODIFIER_MOTION_NONE )
--------------------------------------------------------------------------------
-- Ability Start
function get_down:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()

	-- load data
	local duration = self:GetSpecialValueFor("AbilityDuration")

	caster:AddNewModifier(
		caster, -- player source
		self, -- ability source
		"modifier_get_down", -- modifier name
		{
			duration = duration,
			start = true,
		} -- kv
	)

	-- effects
	local sound_cast = ""
	EmitSoundOn( sound_cast, caster )
end

--------------------------------------------------------------------------------
-- Ability Channeling
-- function get_down:GetChannelTime()

-- end

function get_down:OnChannelFinish( bInterrupted )
	local delay = self:GetSpecialValueFor("sand_storm_invis_delay")
	self:GetCaster():AddNewModifier(
		self:GetCaster(), -- player source
		self, -- ability source
		"modifier_get_down", -- modifier name
		{
			duration = delay,
			start = false,
		} -- kv
	)
end