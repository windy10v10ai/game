miku_dance = class({})
LinkLuaModifier( "modifier_miku_dance", "modifiers/modifier_miku_dance", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_axe_berserkers_call_lua_debuff", "modifiers/modifier_axe_berserkers_call_lua_debuff", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_generic_disarmed", "modifiers/modifier_generic_disarmed", LUA_MODIFIER_MOTION_NONE )
--------------------------------------------------------------------------------
-- Ability Start
function miku_dance:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()

	-- load data
	local duration = self:GetSpecialValueFor("AbilityDuration")

	caster:AddNewModifier(
		caster, -- player source
		self, -- ability source
		"modifier_miku_dance", -- modifier name
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
-- function miku_dance:GetChannelTime()

-- end

function miku_dance:OnChannelFinish( bInterrupted )
	local delay = self:GetSpecialValueFor("sand_storm_invis_delay")
	self:GetCaster():AddNewModifier(
		self:GetCaster(), -- player source
		self, -- ability source
		"modifier_miku_dance", -- modifier name
		{
			duration = delay,
			start = false,
		} -- kv
	)
end