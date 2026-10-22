LinkLuaModifier("modifier_item_orb_of_the_brine_bubble", "items/item_orb_of_the_brine", LUA_MODIFIER_MOTION_NONE)

-- 魔法与治疗增强交给中立强化「滋补」的原生 modifier，以本物品为数值来源；它另读的 bonus_hp_regen 本物品没有，读到 0
function OrbOfTheBrineOnCreated(keys)
	if not IsServer() then return end

	local caster = keys.caster
	local ability = keys.ability
	if not caster or not ability then return end

	ability.restorative_modifier = caster:AddNewModifier(caster, ability, "modifier_item_enhancement_restorative", {})
end

-- 按句柄销毁，不误删中立格或另一件苍洋魔珠挂的同名 modifier
function OrbOfTheBrineOnDestroy(keys)
	if not IsServer() then return end

	local ability = keys.ability
	if not ability then return end

	local modifier = ability.restorative_modifier
	if modifier and not modifier:IsNull() then
		modifier:Destroy()
	end
	ability.restorative_modifier = nil
end

function OrbOfTheBrineOnSpellStart(keys)
	local caster = keys.caster
	local ability = keys.ability
	local target = keys.target
	if not caster or not ability or not target then return end

	if PlayerResource:IsDisableHelpSetForPlayerID(target:GetPlayerOwnerID(), caster:GetPlayerOwnerID()) then
		ability:EndCooldown()
		ability:RefundManaCost()
		return
	end

	target:AddNewModifier(caster, ability, "modifier_item_orb_of_the_brine_bubble",
		{ duration = ability:GetSpecialValueFor("bubble_duration") })

	EmitSoundOn("DOTA_Item.GhostScepter.Activate", caster)
end

--------------------------------------------------------------------------------

modifier_item_orb_of_the_brine_bubble = class({})

function modifier_item_orb_of_the_brine_bubble:GetTexture()
	return "item_orb_of_the_brine"
end

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine_bubble:OnCreated(kv)
	self.heal_tick_interval = self:GetAbility():GetSpecialValueFor("heal_tick_interval")
	local tick_count = self:GetAbility():GetSpecialValueFor("bubble_duration") / self.heal_tick_interval
	self.bubble_heal_per_tick = self:GetAbility():GetSpecialValueFor("bubble_total_heal_tip") / tick_count
	self.bubble_mana_per_tick = self:GetAbility():GetSpecialValueFor("bubble_total_mana_tip") / tick_count
	self.bubble_move_speed = self:GetAbility():GetSpecialValueFor("bubble_move_speed")
	if IsServer() then
		self.nFXIndex = ParticleManager:CreateParticle("particles/act_2/wand_of_the_brine_bubble.vpcf",
			PATTACH_CUSTOMORIGIN, nil)
		ParticleManager:SetParticleControlEnt(self.nFXIndex, 0, self:GetParent(), PATTACH_POINT_FOLLOW, "attach_hitloc",
			self:GetParent():GetOrigin(), true)
		ParticleManager:SetParticleControl(self.nFXIndex, 1, Vector(2.5, 2.5, 2.5)) -- target model scale

		self:StartIntervalThink(self.heal_tick_interval)
	end
end

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine_bubble:OnIntervalThink()
	if IsServer() then
		self:GetParent():Heal(self.bubble_heal_per_tick, self:GetAbility())
		self:GetParent():GiveMana(self.bubble_mana_per_tick)
	end
end

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine_bubble:CheckState()
	local state = {}
	if IsServer() then
		state[MODIFIER_STATE_SILENCED]     = true
		state[MODIFIER_STATE_MUTED]        = true
		state[MODIFIER_STATE_DISARMED]     = true
		state[MODIFIER_STATE_OUT_OF_GAME]  = true
		state[MODIFIER_STATE_MAGIC_IMMUNE] = true
		state[MODIFIER_STATE_INVULNERABLE] = true
		state[MODIFIER_STATE_UNSELECTABLE] = true
	end

	return state
end

function modifier_item_orb_of_the_brine_bubble:DeclareFunctions()
	local funcs =
	{
		MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE,
	}
	return funcs
end

function modifier_item_orb_of_the_brine_bubble:GetModifierMoveSpeed_Absolute(params)
	return self.bubble_move_speed
end

--------------------------------------------------------------------------------

function modifier_item_orb_of_the_brine_bubble:OnDestroy()
	if IsServer() then
		ParticleManager:DestroyParticle(self.nFXIndex, false)
		ParticleManager:ReleaseParticleIndex(self.nFXIndex)
	end
end

--------------------------------------------------------------------------------
