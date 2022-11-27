LinkLuaModifier("modifier_tinker_rearm_command_restricted", "lua_abilities/tinker_rearm_lua/tinker_rearm_lua", LUA_MODIFIER_MOTION_NONE)
tinker_rearm_lua = class({})

function tinker_rearm_lua:GetCastAnimation()
	return ACT_DOTA_TINKER_REARM1
end
--------------------------------------------------------------------------------
-- Ability Start
function tinker_rearm_lua:OnSpellStart()
	-- effects
	local sound_cast = "Hero_Tinker.Rearm"
	EmitSoundOn( sound_cast, self:GetCaster() )
	-- get parent player id
	local playerID = self:GetCaster():GetPlayerID()
	if PlayerResource:IsFakeClient(playerID) then
		self:GetCaster():AddNewModifier(
			self:GetCaster(), -- player source
			self, -- ability source
			"modifier_tinker_rearm_command_restricted", -- modifier name
			{ duration = self:GetChannelTime() } -- kv
		)
	end
end

--------------------------------------------------------------------------------
-- Ability Channeling
function tinker_rearm_lua:OnChannelFinish( bInterrupted )
	local caster = self:GetCaster()

	-- stop effects
	local sound_cast = "Hero_Tinker.Rearm"
	StopSoundOn( sound_cast, self:GetCaster() )

	if bInterrupted then
		-- remove modifier modifier_tinker_rearm_command_restricted
		caster:RemoveModifierByName( "modifier_tinker_rearm_command_restricted" )
		return
	end

	-- find all refreshable abilities
	for i=0,caster:GetAbilityCount()-1 do
		local ability = caster:GetAbilityByIndex( i )
		if ability and ability:GetAbilityType()~=DOTA_ABILITY_TYPE_ATTRIBUTES then
			ability:RefreshCharges()
			ability:EndCooldown()
		end
	end

	-- find all refreshable items
	for i=0,8 do
		local item = caster:GetItemInSlot(i)
		if item then
			local pass = false
			if item:GetPurchaser()==caster and not self:IsItemException( item ) then
				pass = true
			end

			if pass then
				item:EndCooldown()
			end
		end
	end

	local item = caster:GetItemInSlot(DOTA_ITEM_TP_SCROLL)
	if item then
		item:EndCooldown()
	end

	-- effects
	self:PlayEffects()
end

--------------------------------------------------------------------------------
-- Helper
function tinker_rearm_lua:IsItemException( item )
	return self.ItemException[item:GetName()]
end
tinker_rearm_lua.ItemException = {
	["item_aeon_disk"] = true,
	["item_arcane_boots"] = true,
	["item_black_king_bar"] = true,
	["item_hand_of_midas"] = true,
	["item_helm_of_the_dominator"] = true,
	["item_meteor_hammer"] = true,
	["item_necronomicon"] = true,
	["item_necronomicon_2"] = true,
	["item_necronomicon_3"] = true,
	["item_refresher"] = true,
	["item_refresher_shard"] = true,
	["item_refresh_core"] = true,
	["item_pipe"] = true,
	["item_sphere"] = true,

	["item_aeon_pendant"] = true,
	["item_black_king_bar_2"] = true,
	["item_sphere_2"] = true,
	["item_insight_armor"] = true,
	["item_hand_of_group"] = true,
}

--------------------------------------------------------------------------------
-- Effects
function tinker_rearm_lua:PlayEffects()
	-- Get Resources
	local particle_cast = "particles/units/heroes/hero_tinker/tinker_rearm.vpcf"
	local sound_cast = "Hero_Tinker.RearmStart"

	-- Create Particle
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, self:GetCaster() )
	assert(loadfile("lua_abilities/rubick_spell_steal_lua/rubick_spell_steal_lua_color"))(self,effect_cast)
	ParticleManager:ReleaseParticleIndex( effect_cast )

	EmitSoundOn( sound_cast, self:GetCaster() )
end


-- modifier can not order
modifier_tinker_rearm_command_restricted = class({})
function modifier_tinker_rearm_command_restricted:IsHidden() return true end
function modifier_tinker_rearm_command_restricted:IsDebuff() return false end
function modifier_tinker_rearm_command_restricted:IsPurgable() return false end
function modifier_tinker_rearm_command_restricted:RemoveOnDeath() return true end

function modifier_tinker_rearm_command_restricted:CheckState()
	local state = {
		[MODIFIER_STATE_COMMAND_RESTRICTED] = true,
	}

	return state
end
