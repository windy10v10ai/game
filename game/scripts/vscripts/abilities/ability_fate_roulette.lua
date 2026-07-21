LinkLuaModifier("modifier_ability_fate_roulette_counter", "abilities/ability_fate_roulette", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_ability_fate_roulette_destined", "abilities/ability_fate_roulette", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_ability_fate_roulette_stun", "abilities/ability_fate_roulette", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_ability_fate_roulette_dispel", "abilities/ability_fate_roulette", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_ability_fate_roulette_break", "abilities/ability_fate_roulette", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_ability_fate_roulette_root", "abilities/ability_fate_roulette", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_ability_fate_roulette_mute", "abilities/ability_fate_roulette", LUA_MODIFIER_MOTION_NONE)

ability_fate_roulette = class({})

local FATE_EFFECT_CRITICAL = 1
local FATE_EFFECT_STUN = 2
local FATE_EFFECT_DISPEL = 3
local FATE_EFFECT_BREAK = 4
local FATE_EFFECT_ROOT = 5
local FATE_EFFECT_MUTE = 6
local FATE_EFFECT_COUNT = 6

function ability_fate_roulette:GetIntrinsicModifierName()
    return "modifier_ability_fate_roulette_counter"
end

function ability_fate_roulette:OnSpellStart()
    local caster = self:GetCaster()
    local duration = self:GetSpecialValueFor("active_duration")

    caster:AddNewModifier(caster, self, "modifier_ability_fate_roulette_destined", {
        duration = duration
    })
    caster:EmitSound("DOTA_Item.Refresher.Activate")
end

modifier_ability_fate_roulette_counter = class({})

function modifier_ability_fate_roulette_counter:IsHidden()
    return false
end

function modifier_ability_fate_roulette_counter:IsDebuff()
    return false
end

function modifier_ability_fate_roulette_counter:IsPurgable()
    return false
end

function modifier_ability_fate_roulette_counter:RemoveOnDeath()
    return false
end

function modifier_ability_fate_roulette_counter:GetTexture()
    return "ability_fate_roulette"
end

function modifier_ability_fate_roulette_counter:OnCreated()
    if not IsServer() then return end

    self.attack_rolls = {}
    self.guaranteed_records = {}
    self.primary_attack_targets = {}
    self:SetStackCount(0)
end

function modifier_ability_fate_roulette_counter:OnRefresh()
    if not IsServer() then return end

    self.attack_rolls = self.attack_rolls or {}
    self.guaranteed_records = self.guaranteed_records or {}
    self.primary_attack_targets = self.primary_attack_targets or {}
    local attacks_before_proc = self:GetAttacksBeforeProc()
    self:SetStackCount(math.min(self:GetStackCount(), attacks_before_proc))
end

function modifier_ability_fate_roulette_counter:DeclareFunctions()
    return {
        MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE,
        MODIFIER_PROPERTY_TOOLTIP,
        MODIFIER_EVENT_ON_ATTACK_RECORD,
        MODIFIER_EVENT_ON_ATTACK_LANDED,
        MODIFIER_EVENT_ON_ATTACK_RECORD_DESTROY,
    }
end

function modifier_ability_fate_roulette_counter:OnTooltip()
    return self:GetStackCount()
end

function modifier_ability_fate_roulette_counter:CheckState()
    local parent = self:GetParent()
    local active_trigger = parent:HasModifier("modifier_ability_fate_roulette_destined")
    local passive_trigger = self:GetStackCount() >= self:GetAttacksBeforeProc()
    local pending_trigger = self.guaranteed_records and next(self.guaranteed_records) ~= nil

    if active_trigger or passive_trigger or pending_trigger then
        return {
            [MODIFIER_STATE_CANNOT_MISS] = true,
        }
    end
end

function modifier_ability_fate_roulette_counter:GetAttacksBeforeProc()
    local ability = self:GetAbility()
    if not ability or ability:IsNull() then return 1 end

    return math.max(ability:GetSpecialValueFor("attacks_before_proc"), 1)
end

function modifier_ability_fate_roulette_counter:IsWhirlwindAttack(params)
    local whirlwind = self:GetParent():FindModifierByName("modifier_windrunner_whirlwind_custom")
    if not whirlwind then return false end

    local record = params.record or -1
    if whirlwind.IsWhirlwindAttackRecord and whirlwind:IsWhirlwindAttackRecord(record) then
        return true
    end

    -- Modifier event ordering is not guaranteed. The registration flag identifies the attack
    -- while PerformAttack is dispatching its record event.
    return whirlwind.IsRegisteringWhirlwindAttack
        and whirlwind:IsRegisteringWhirlwindAttack()
end

function modifier_ability_fate_roulette_counter:IsSupportedSplitAttack(params)
    if params.no_attack_cooldown ~= true and params.no_attack_cooldown ~= 1 then return true end
    if self:IsWhirlwindAttack(params) then return true end

    -- Time Lock and similar bonus attacks strike the current primary target again.
    -- Medusa/Hydra split attacks select secondary targets, so reject same-target bonus records.
    local target = params.target
    if target and self.primary_attack_targets then
        local target_index = target:entindex()
        for _, primary_target_index in pairs(self.primary_attack_targets) do
            if primary_target_index == target_index then
                return false
            end
        end
    end

    local parent = self:GetParent()
    local split_shot = parent:FindAbilityByName("medusa_split_shot")
    if parent:HasScepter()
        and parent:HasModifier("modifier_medusa_split_shot")
        and split_shot
        and split_shot:GetLevel() > 0 then
        return true
    end

    if not parent:HasModifier("modifier_item_hydras_breath") then return false end

    return parent:FindItemInInventory("item_hydras_breath") ~= nil
        or parent:FindItemInInventory("item_hydras_breath_2") ~= nil
end

function modifier_ability_fate_roulette_counter:IsEligibleAttack(params)
    local parent = self:GetParent()
    local target = params.target
    local ability = self:GetAbility()

    if not ability or ability:IsNull() or ability:GetLevel() <= 0 then return false end
    if params.attacker ~= parent then return false end
    if not target or target:IsNull() then return false end
    if parent:IsIllusion() or parent:IsBuilding() then return false end
    if target:IsBuilding() or target:IsOther() then return false end
    if target:GetTeamNumber() == parent:GetTeamNumber() then return false end
    if not self:IsSupportedSplitAttack(params) then return false end

    return true
end

function modifier_ability_fate_roulette_counter:PrepareRouletteRoll(params)
    if not self:IsEligibleAttack(params) then return end

    self.attack_rolls = self.attack_rolls or {}
    local record = params.record or -1
    local roll = self.attack_rolls[record]
    if roll then return roll end

    local parent = self:GetParent()
    local active_trigger = parent:HasModifier("modifier_ability_fate_roulette_destined")
    local passive_trigger = not active_trigger
        and self:GetStackCount() >= self:GetAttacksBeforeProc()

    if not active_trigger and not passive_trigger then return end

    roll = {
        effect = RandomInt(1, FATE_EFFECT_COUNT),
        passive_trigger = passive_trigger,
    }
    self.attack_rolls[record] = roll

    self.guaranteed_records = self.guaranteed_records or {}
    self.guaranteed_records[record] = true

    return roll
end

function modifier_ability_fate_roulette_counter:OnAttackRecord(params)
    if not IsServer() then return end

    if params.attacker == self:GetParent()
        and params.target
        and not params.target:IsNull()
        and params.no_attack_cooldown ~= true
        and params.no_attack_cooldown ~= 1 then
        self.primary_attack_targets = self.primary_attack_targets or {}
        self.primary_attack_targets[params.record or -1] = params.target:entindex()
    end

    self:PrepareRouletteRoll(params)
end

function modifier_ability_fate_roulette_counter:GetModifierPreAttack_CriticalStrike(params)
    if not IsServer() then return end

    local roll = self:PrepareRouletteRoll(params)
    if roll and roll.effect == FATE_EFFECT_CRITICAL then
        return self:GetAbility():GetSpecialValueFor("critical_damage")
    end
end

function modifier_ability_fate_roulette_counter:OnAttackLanded(params)
    if not IsServer() or not self:IsEligibleAttack(params) then return end

    self.attack_rolls = self.attack_rolls or {}
    local record = params.record or -1
    local roll = self.attack_rolls[record]

    if roll then
        if roll.passive_trigger then
            self:SetStackCount(0)
        end

        self:PlayRouletteEffect(params.target, roll.effect)
        self.attack_rolls[record] = nil
        self.guaranteed_records[record] = nil
        return
    end

    local parent = self:GetParent()
    if parent:HasModifier("modifier_ability_fate_roulette_destined") then return end
    local is_no_attack_cooldown = params.no_attack_cooldown == true or params.no_attack_cooldown == 1
    if is_no_attack_cooldown and not self:IsWhirlwindAttack(params) then return end

    local max_stacks = self:GetAttacksBeforeProc()
    self:SetStackCount(math.min(self:GetStackCount() + 1, max_stacks))
end

function modifier_ability_fate_roulette_counter:OnAttackRecordDestroy(params)
    if not IsServer() or params.attacker ~= self:GetParent() then return end
    if not self.attack_rolls then return end

    local record = params.record or -1
    self.attack_rolls[record] = nil
    if self.primary_attack_targets then
        self.primary_attack_targets[record] = nil
    end
    if self.guaranteed_records then
        self.guaranteed_records[record] = nil
    end
end

function modifier_ability_fate_roulette_counter:GetInheritedRouletteEffect(record)
    local roll = self.attack_rolls and self.attack_rolls[record or -1]
    return roll and roll.effect or 0
end

function modifier_ability_fate_roulette_counter:PlayInheritedRouletteEffect(target, record)
    local effect = self:GetInheritedRouletteEffect(record)
    if effect > 0 then
        self:PlayRouletteEffect(target, effect)
    end
end

function modifier_ability_fate_roulette_counter:PlayRouletteEffect(target, effect)
    local parent = self:GetParent()
    local ability = self:GetAbility()
    if not ability or ability:IsNull() or not target or target:IsNull() then return end

    -- The purge is gameplay-only. Do not reuse Aeon Disk's looping buff particle here: it can
    -- leave a golden haze behind and incorrectly suggests that an item effect was triggered.
    parent:Purge(false, true, false, false, false)

    if effect == FATE_EFFECT_CRITICAL then
        target:EmitSound("Hero_Brewmaster.Brawler.Crit")
        return
    end

    local duration = 0
    local modifier_name = nil

    if effect == FATE_EFFECT_STUN then
        duration = ability:GetSpecialValueFor("stun_duration")
        modifier_name = "modifier_ability_fate_roulette_stun"
    elseif effect == FATE_EFFECT_DISPEL then
        duration = ability:GetSpecialValueFor("effect_duration")
        modifier_name = "modifier_ability_fate_roulette_dispel"
    elseif effect == FATE_EFFECT_BREAK then
        duration = ability:GetSpecialValueFor("effect_duration")
        modifier_name = "modifier_ability_fate_roulette_break"
    elseif effect == FATE_EFFECT_ROOT then
        duration = ability:GetSpecialValueFor("effect_duration")
        modifier_name = "modifier_ability_fate_roulette_root"
    elseif effect == FATE_EFFECT_MUTE then
        duration = ability:GetSpecialValueFor("effect_duration")
        modifier_name = "modifier_ability_fate_roulette_mute"
    end

    if not modifier_name or duration <= 0 or not target:IsAlive() then return end

    duration = math.max(duration * (1 - target:GetStatusResistance()), 0.01)
    target:AddNewModifier(parent, ability, modifier_name, { duration = duration })
end

modifier_ability_fate_roulette_destined = class({})

function modifier_ability_fate_roulette_destined:IsHidden()
    return false
end

function modifier_ability_fate_roulette_destined:IsDebuff()
    return false
end

function modifier_ability_fate_roulette_destined:IsPurgable()
    return false
end

function modifier_ability_fate_roulette_destined:GetTexture()
    return "ability_fate_roulette"
end

function modifier_ability_fate_roulette_destined:GetEffectName()
    return "particles/units/heroes/hero_invoker/invoker_ghost_walk_debuff_wex.vpcf"
end

function modifier_ability_fate_roulette_destined:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end

modifier_ability_fate_roulette_stun = class({})

function modifier_ability_fate_roulette_stun:IsHidden()
    return false
end

function modifier_ability_fate_roulette_stun:IsDebuff()
    return true
end

function modifier_ability_fate_roulette_stun:IsPurgable()
    return false
end

function modifier_ability_fate_roulette_stun:IsPurgeException()
    return true
end

function modifier_ability_fate_roulette_stun:GetTexture()
    return "sven_storm_bolt"
end

function modifier_ability_fate_roulette_stun:IsStunDebuff()
    return true
end

function modifier_ability_fate_roulette_stun:GetEffectName()
    return "particles/generic_gameplay/generic_stunned.vpcf"
end

function modifier_ability_fate_roulette_stun:GetEffectAttachType()
    return PATTACH_OVERHEAD_FOLLOW
end

function modifier_ability_fate_roulette_stun:CheckState()
    return {
        [MODIFIER_STATE_STUNNED] = true,
    }
end

modifier_ability_fate_roulette_dispel = class({})

function modifier_ability_fate_roulette_dispel:IsHidden()
    return false
end

function modifier_ability_fate_roulette_dispel:IsDebuff()
    return true
end

function modifier_ability_fate_roulette_dispel:IsPurgable()
    return false
end

function modifier_ability_fate_roulette_dispel:GetTexture()
    return "item_blue_fantasy"
end

function modifier_ability_fate_roulette_dispel:GetEffectName()
    return "particles/units/heroes/hero_oracle/oracle_fortune_purge.vpcf"
end

function modifier_ability_fate_roulette_dispel:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end


function modifier_ability_fate_roulette_dispel:OnCreated()
    local ability = self:GetAbility()
    self.dispel_interval = ability and ability:GetSpecialValueFor("dispel_interval") or 0.2

    if not IsServer() then return end
    self:DispelTarget()
    self:StartIntervalThink(self.dispel_interval)
end

function modifier_ability_fate_roulette_dispel:OnRefresh()
    if not IsServer() then return end
    self:DispelTarget()
end

function modifier_ability_fate_roulette_dispel:OnIntervalThink()
    self:DispelTarget()
end

function modifier_ability_fate_roulette_dispel:DispelTarget()
    local parent = self:GetParent()
    if parent and not parent:IsNull() then
        parent:Purge(true, false, false, false, false)
    end
end

modifier_ability_fate_roulette_break = class({})

function modifier_ability_fate_roulette_break:IsHidden()
    return false
end

function modifier_ability_fate_roulette_break:IsDebuff()
    return true
end

function modifier_ability_fate_roulette_break:IsPurgable()
    return false
end

function modifier_ability_fate_roulette_break:GetTexture()
    return "shadow_demon_demonic_purge"
end

function modifier_ability_fate_roulette_break:CheckState()
    return {
        [MODIFIER_STATE_PASSIVES_DISABLED] = true,
    }
end

function modifier_ability_fate_roulette_break:GetEffectName()
    return "particles/generic_gameplay/generic_break.vpcf"
end

function modifier_ability_fate_roulette_break:GetEffectAttachType()
    return PATTACH_OVERHEAD_FOLLOW
end

modifier_ability_fate_roulette_root = class({})

function modifier_ability_fate_roulette_root:IsHidden()
    return false
end

function modifier_ability_fate_roulette_root:IsDebuff()
    return true
end

function modifier_ability_fate_roulette_root:IsPurgable()
    return false
end

function modifier_ability_fate_roulette_root:IsPurgeException()
    return true
end

function modifier_ability_fate_roulette_root:GetTexture()
    return "crystal_maiden_frostbite"
end

function modifier_ability_fate_roulette_root:OnCreated()
    if not IsServer() then return end
    self:GetParent():EmitSound("Hero_AbyssalUnderlord.Pit.TargetHero")
end

function modifier_ability_fate_roulette_root:CheckState()
    return {
        [MODIFIER_STATE_ROOTED] = true,
    }
end

function modifier_ability_fate_roulette_root:GetEffectName()
    return "particles/units/heroes/heroes_underlord/abyssal_underlord_pitofmalice_stun.vpcf"
end

function modifier_ability_fate_roulette_root:GetEffectAttachType()
    return PATTACH_ABSORIGIN_FOLLOW
end

modifier_ability_fate_roulette_mute = class({})

function modifier_ability_fate_roulette_mute:IsHidden()
    return false
end

function modifier_ability_fate_roulette_mute:IsDebuff()
    return true
end

function modifier_ability_fate_roulette_mute:IsPurgable()
    return false
end

function modifier_ability_fate_roulette_mute:GetTexture()
    return "item_nullifier"
end

function modifier_ability_fate_roulette_mute:OnCreated()
    if not IsServer() then return end
    self:GetParent():EmitSound("DOTA_Item.Nullifier.Slow")
end

function modifier_ability_fate_roulette_mute:CheckState()
    return {
        [MODIFIER_STATE_MUTED] = true,
    }
end

function modifier_ability_fate_roulette_mute:GetEffectName()
    return "particles/items4_fx/nullifier_mute.vpcf"
end

function modifier_ability_fate_roulette_mute:GetEffectAttachType()
    return PATTACH_OVERHEAD_FOLLOW
end

function modifier_ability_fate_roulette_mute:GetStatusEffectName()
    return "particles/status_fx/status_effect_nullifier.vpcf"
end

function modifier_ability_fate_roulette_mute:StatusEffectPriority()
    return 20
end
