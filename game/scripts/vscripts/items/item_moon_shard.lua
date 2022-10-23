function MoonShardOnSpell( keys )
	local caster = keys.caster
	local target = keys.target
	local ability = keys.ability
	local modifier = keys.modifier

	if (caster:IsRealHero() or caster:GetName() == "npc_dota_lone_druid_bear") and (target:IsRealHero() or target:GetName() == "npc_dota_lone_druid_bear") and not caster:HasModifier("modifier_arc_warden_tempest_double") and not target:HasModifier("modifier_arc_warden_tempest_double") then
		AddStacks(ability, caster, target, modifier, 1, true)
		EmitSoundOnClient("Item.MoonShard.Consume", target)
		caster:RemoveItem(ability)
	end
end

LinkLuaModifier("modifier_item_moon_shard_datadriven_consumed", "items/item_moon_shard.lua", LUA_MODIFIER_MOTION_NONE)

if modifier_item_moon_shard_datadriven_consumed == nil then modifier_item_moon_shard_datadriven_consumed = class({}) end

function modifier_item_moon_shard_datadriven_consumed:RemoveOnDeath()	return false end
function modifier_item_moon_shard_datadriven_consumed:IsDebuff()		return false end
function modifier_item_moon_shard_datadriven_consumed:IsPurgable()		return false end
function modifier_item_moon_shard_datadriven_consumed:IsPermanent()		return true end

function modifier_item_moon_shard_datadriven_consumed:OnCreated()
	if self:GetAbility() then
		-- get stack count
		local stack_count = self:GetStackCount()
		-- set ability properties
		self.bonus_attack_speed = self:GetAbility():GetSpecialValueFor("consumed_bonus_attack_speed") * stack_count
		self.bonus_night_vision = self:GetAbility():GetSpecialValueFor("consumed_bonus_night_vision") * stack_count
		self.bonus_day_vision = self:GetAbility():GetSpecialValueFor("consumed_bonus_day_vision") * stack_count
	end
end

-- on stack count change
function modifier_item_moon_shard_datadriven_consumed:OnStackCountChanged(old_stack_count)
	if self:GetAbility() then
		-- get stack count
		local stack_count = self:GetStackCount()
		-- set ability properties
		self.bonus_attack_speed = self:GetAbility():GetSpecialValueFor("consumed_bonus_attack_speed") * stack_count
		self.bonus_night_vision = self:GetAbility():GetSpecialValueFor("consumed_bonus_night_vision") * stack_count
		self.bonus_day_vision = self:GetAbility():GetSpecialValueFor("consumed_bonus_day_vision") * stack_count
	end
end

function modifier_item_moon_shard_datadriven_consumed:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
		MODIFIER_PROPERTY_BONUS_DAY_VISION,
		MODIFIER_PROPERTY_BONUS_NIGHT_VISION
	}
end

function modifier_item_moon_shard_datadriven_consumed:GetModifierAttackSpeedBonus_Constant()
	return self.bonus_attack_speed
end

function modifier_item_moon_shard_datadriven_consumed:GetBonusDayVision()
	return self.bonus_day_vision
end

function modifier_item_moon_shard_datadriven_consumed:GetBonusNightVision()
	return self.bonus_night_vision
end

function modifier_item_moon_shard_datadriven_consumed:AllowIllusionDuplicate()
	return false
end

function modifier_item_moon_shard_datadriven_consumed:GetTexture()
	return "item_moon_shard_datadriven"
end
