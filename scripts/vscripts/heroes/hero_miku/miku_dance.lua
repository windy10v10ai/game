miku_dance = class({})
LinkLuaModifier( "modifier_miku_dance", "modifiers/hero_miku/modifier_miku_dance", LUA_MODIFIER_MOTION_NONE )
--------------------------------------------------------------------------------
-- Ability Start
function miku_dance:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()

	-- load data
	local duration = self:GetSpecialValueFor("ability_duration")

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
	local delay = self:GetSpecialValueFor("attack_interval")
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
