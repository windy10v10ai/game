--------------------------------------------------------------------------------
brewmaster_primal_split_lua = class({})
--------------------------------------------------------------------------------
LinkLuaModifier("modifier_brewmaster_primal_split_lua_duration", "heroes/hero_brewmaster/primal_split",
	LUA_MODIFIER_MOTION_NONE)
--------------------------------------------------------------------------------
-- Ability Start
function brewmaster_primal_split_lua:OnSpellStart()
	-- unit identifier
	local caster = self:GetCaster()
	-- load data
	local duration = self:GetSpecialValueFor("duration")
	-- add modifier
	caster:AddNewModifier(
		caster,                                    -- player source
		self,                                      -- ability source
		"modifier_brewmaster_primal_split_lua_duration", -- modifier name
		{ duration = duration }                    -- kv
	)
	-- effects
	local sound_cast = "Hero_Brewmaster.PrimalSplit.Spawn"
	EmitSoundOn(sound_cast, caster)
end

--------------------------------------------------------------------------------
modifier_brewmaster_primal_split_lua_duration = class({})
--------------------------------------------------------------------------------
-- Classifications
function modifier_brewmaster_primal_split_lua_duration:IsHidden() return false end

function modifier_brewmaster_primal_split_lua_duration:IsDebuff() return false end

function modifier_brewmaster_primal_split_lua_duration:IsStunDebuff() return false end

function modifier_brewmaster_primal_split_lua_duration:IsPurgable() return false end

--------------------------------------------------------------------------------
-- Initializations
function modifier_brewmaster_primal_split_lua_duration:OnCreated(kv)
	self.dodge_chance = self:GetAbility():GetSpecialValueFor("dodge_chance")
	-- self.crit_chance = self:GetAbility():GetSpecialValueFor("crit_chance")
	-- self.crit_multiplier = self:GetAbility():GetSpecialValueFor("crit_multiplier")
	self.attack_speed = self:GetAbility():GetSpecialValueFor("attack_speed")
	self.magic_resist = self:GetAbility():GetSpecialValueFor("magic_resist")
	self.armor = self:GetAbility():GetSpecialValueFor("armor")
	-- self.movespeed = self:GetAbility():GetSpecialValueFor("movespeed")
	-- self.slow_duration = self:GetAbility():GetSpecialValueFor("slow_duration")
	self.bonus_move_speed = self:GetAbility():GetSpecialValueFor("bonus_move_speed")
	self.bonus_status_resist = self:GetAbility():GetSpecialValueFor("bonus_status_resist")
	if not IsServer() then return end
	self.parent = self:GetParent()
	self.ability = self:GetAbility()
	-- references
	self.split_duration = self.ability:GetSpecialValueFor("split_duration")
	-- Inv
	self.parent:AddNewModifier(self.parent, self.ability, "modifier_invulnerable", { duration = self.split_duration })

	self.dodge_chance = self.ability:GetSpecialValueFor("dodge_chance")
	self.crit_chance = self.ability:GetSpecialValueFor("crit_chance")
	self.active_multiplier = self.ability:GetSpecialValueFor("active_multiplier")
	self.crit_multiplier = self.ability:GetSpecialValueFor("crit_multiplier")
	self.attack_speed = self.ability:GetSpecialValueFor("attack_speed")
	self.magic_resist = self.ability:GetSpecialValueFor("magic_resist")
	self.armor = self.ability:GetSpecialValueFor("armor")
	self.movespeed = self.ability:GetSpecialValueFor("movespeed")
	self.slow_duration = self.ability:GetSpecialValueFor("slow_duration")
	self.bonus_move_speed = self.ability:GetSpecialValueFor("bonus_move_speed")
	self.bonus_status_resist = self.ability:GetSpecialValueFor("bonus_status_resist")
end

function modifier_brewmaster_primal_split_lua_duration:OnRefresh(kv) end

function modifier_brewmaster_primal_split_lua_duration:OnRemoved() end

function modifier_brewmaster_primal_split_lua_duration:OnDestroy()
	if not IsServer() then return end
	if IsValidEntity(self.parent) then
		-- play effects
		local sound_cast = "Hero_Brewmaster.PrimalSplit.Return"
		EmitSoundOn(sound_cast, self.parent)
		-- ultimate hangover
		if self.parent:HasAbility("brewmaster_belligerent") then
			local bellAB = self.parent:FindAbilityByName("brewmaster_belligerent")
			if bellAB then
				self.parent:AddNewModifier(self.parent, bellAB, "modifier_brewmaster_belligerent_damage",
					{ duration = bellAB:GetSpecialValueFor("damage_duration_split") })
			end
		end
	end
end

--------------------------------------------------------------------------------
-- Modifier Effects
function modifier_brewmaster_primal_split_lua_duration:DeclareFunctions()
	local funcs = {
		MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
		MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,

		MODIFIER_PROPERTY_EVASION_CONSTANT,
		MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,

		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE,

		MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING,
		MODIFIER_EVENT_ON_ATTACK_LANDED,
	}
	return funcs
end

function modifier_brewmaster_primal_split_lua_duration:GetModifierPhysicalArmorBonus() return self.armor end

function modifier_brewmaster_primal_split_lua_duration:GetModifierMagicalResistanceBonus() return self.magic_resist end

function modifier_brewmaster_primal_split_lua_duration:GetModifierEvasion_Constant() return self.dodge_chance end

function modifier_brewmaster_primal_split_lua_duration:GetModifierMoveSpeedBonus_Percentage() return self
	.bonus_move_speed end

function modifier_brewmaster_primal_split_lua_duration:GetModifierAttackSpeedBonus_Constant() return self.attack_speed end

function modifier_brewmaster_primal_split_lua_duration:GetModifierPreAttack_CriticalStrike(keys)
	if not IsServer() or self:GetParent():IsIllusion() then return end
	if keys.attacker == self.parent and not keys.target:IsBuilding() and not keys.target:IsOther() then
		if RollPseudoRandomPercentage(self.crit_chance, DOTA_PSEUDO_RANDOM_BREWMASTER_CRIT, self.parent) then
			self.parent:EmitSound("Hero_Brewmaster.Brawler.Crit")
			return self.crit_multiplier
		else
			return 0
		end
	end
end

function modifier_brewmaster_primal_split_lua_duration:OnAttackLanded(keys)
	if not IsServer() then return end
	if keys.attacker ~= self.parent or keys.target:IsBuilding() or not keys.target:IsAlive() then return end
	keys.target:AddNewModifier(self.parent, self.ability, "modifier_brewmaster_void_brawler_slow",
		{ duration = self.slow_duration })
end

function modifier_brewmaster_primal_split_lua_duration:GetModifierStatusResistanceStacking()
	return self.bonus_status_resist
end

--------------------------------------------------------------------------------
-- Status Effects
function modifier_brewmaster_primal_split_lua_duration:CheckState()
	local state = {
		[MODIFIER_STATE_NO_UNIT_COLLISION] = true,
	}
	return state
end

--------------------------------------------------------------------------------
-- Graphics & Animations
function modifier_brewmaster_primal_split_lua_duration:GetEffectName()
	return "particles/units/heroes/hero_brewmaster/brewmaster_fire_ambient.vpcf"
end

function modifier_brewmaster_primal_split_lua_duration:GetEffectAttachType()
	return PATTACH_ABSORIGIN_FOLLOW
end
