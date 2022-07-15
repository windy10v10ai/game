LinkLuaModifier("modifier_item_necronomicon_staff", "items/item_necronomicon_staff.lua", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_necronomicon_staff_debuff", "items/item_necronomicon_staff.lua", LUA_MODIFIER_MOTION_NONE)
--Abilities
if item_necronomicon_staff == nil then
	item_necronomicon_staff = class({})
end
function item_necronomicon_staff:GetIntrinsicModifierName()
	return "modifier_item_necronomicon_staff"
end


function item_necronomicon_staff:OnSpellStart()
    local target=self:GetCursorTarget()
    local caster=self:GetCaster()
    local duration=self:GetSpecialValueFor("sheep_duration")
    local blast_damage_base=self:GetSpecialValueFor("blast_damage_base")
    local blast_att_multiplier=self:GetSpecialValueFor("blast_att_multiplier")
    -- target:EmitSound("DOTA_Item.Nullifier.Target")

    local allAtt = caster:GetStrength() + caster:GetAgility() + caster:GetIntellect()
    local damage = blast_damage_base + allAtt * blast_att_multiplier
    local damageTable = {
        victim = target,
        attacker = caster,
        damage = damage,
        damage_type = DAMAGE_TYPE_MAGICAL,
        ability = self.ability,
        }
    ApplyDamage(damageTable)
    target:EmitSound("DOTA_Item.Sheepstick.Activate")
    target:AddNewModifier(caster,self,"modifier_item_necronomicon_staff_debuff",{duration=duration})
end
---------------------------------------------------------------------
--Modifiers
if modifier_item_necronomicon_staff == nil then
	modifier_item_necronomicon_staff = class({})
end
function modifier_item_necronomicon_staff:IsHidden()
	return true
end
function modifier_item_necronomicon_staff:IsDebuff()
	return false
end
function modifier_item_necronomicon_staff:IsPurgable()
	return false
end
function modifier_item_necronomicon_staff:IsPurgeException()
	return false
end
function modifier_item_necronomicon_staff:IsStunDebuff()
	return false
end
function modifier_item_necronomicon_staff:AllowIllusionDuplicate()
	return false
end

function modifier_item_necronomicon_staff:OnCreated(params)
	local hParent = self:GetParent()
    if self:GetAbility() == nil then
		return
    end
    self.ability=self:GetAbility()
	self.bonus_strength = self.ability:GetSpecialValueFor("bonus_strength")
	self.bonus_agility = self.ability:GetSpecialValueFor("bonus_agility")
	self.bonus_intellect = self.ability:GetSpecialValueFor("bonus_intellect")
	self.bonus_mana_regen = self.ability:GetSpecialValueFor("bonus_mana_regen")

	self.sheep_duration = self.ability:GetSpecialValueFor("sheep_duration")
	self.tooltip_range = self.ability:GetSpecialValueFor("tooltip_range")
end

function modifier_item_necronomicon_staff:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
		MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
		MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
		MODIFIER_PROPERTY_MANA_REGEN_CONSTANT,
	}
end
function modifier_item_necronomicon_staff:GetModifierBonusStats_Strength(params)
	return self.bonus_strength
end
function modifier_item_necronomicon_staff:GetModifierBonusStats_Agility(params)
	return self.bonus_agility
end
function modifier_item_necronomicon_staff:GetModifierBonusStats_Intellect(params)
	return self.bonus_intellect
end
function modifier_item_necronomicon_staff:GetModifierConstantManaRegen(params)
    return self.bonus_mana_regen
end

---------------------------------------------------------------------
if modifier_item_necronomicon_staff_debuff == nil then
	modifier_item_necronomicon_staff_debuff = class({})
end
function modifier_item_necronomicon_staff_debuff:IsHidden()
	return false
end
function modifier_item_necronomicon_staff_debuff:IsDebuff()
	return true
end
function modifier_item_necronomicon_staff_debuff:IsPurgable()
	return false
end
function modifier_item_necronomicon_staff_debuff:IsPurgeException()
	return true
end
function modifier_item_necronomicon_staff_debuff:IsStunDebuff()
	return false
end
function modifier_item_necronomicon_staff_debuff:AllowIllusionDuplicate()
	return false
end
function modifier_item_necronomicon_staff_debuff:OnCreated(params)
	self.sheep_movement_speed = self:GetAbility():GetSpecialValueFor("sheep_movement_speed")
	self.blast_damage_multiplier = self:GetAbility():GetSpecialValueFor("blast_damage_multiplier")
end
function modifier_item_necronomicon_staff_debuff:CheckState()
	return {
		[MODIFIER_STATE_SILENCED] = true,
		[MODIFIER_STATE_MUTED] = true,
		[MODIFIER_STATE_DISARMED] = true,
		[MODIFIER_STATE_HEXED] = true,
	}
end
function modifier_item_necronomicon_staff_debuff:DeclareFunctions()
	return {
		MODIFIER_PROPERTY_MOVESPEED_BASE_OVERRIDE,
		MODIFIER_PROPERTY_MODEL_CHANGE,
		MODIFIER_PROPERTY_PRESERVE_PARTICLES_ON_MODEL_CHANGE,
        MODIFIER_PROPERTY_MAGICAL_RESISTANCE_DECREPIFY_UNIQUE,

	}
end
function modifier_item_necronomicon_staff_debuff:GetModifierMoveSpeedOverride(params)
	return self.sheep_movement_speed
end
function modifier_item_necronomicon_staff_debuff:GetModifierModelChange(params)
	return "models/props_gameplay/pig.vmdl"
end
function modifier_item_necronomicon_staff_debuff:PreserveParticlesOnModelChanged(params)
	return 1
end
function modifier_item_necronomicon_staff_debuff:GetModifierMagicalResistanceDecrepifyUnique(params)
    return self.blast_damage_multiplier
end
