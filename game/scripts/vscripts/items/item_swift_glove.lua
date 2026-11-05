--[[ 无限手套：点石成金、原版粗暴与连锁闪电的挂摘由配置物品的 RunScript 驱动。 ]]

if modifier_item_swift_glove_chain_lightning == nil then modifier_item_swift_glove_chain_lightning = class({}) end
LinkLuaModifier("modifier_item_swift_glove_chain_lightning", "items/item_swift_glove.lua", LUA_MODIFIER_MOTION_NONE)
-- This Lua item must register the shared kill modifier instead of relying on Dragon Destruction loading first.
LinkLuaModifier("modifier_ignore_invulnerable_kill", "modifiers/global/modifier_ignore_invulnerable_kill",
    LUA_MODIFIER_MOTION_NONE)

-- 原版粗暴同一英雄多份会按 (1+r)^n 复利放大，只能挂 1 份；多把手套共用一份并按件数记账
local crudeStates = {}

local function AcquireCrude(caster, ability)
    local key = caster:entindex()
    local state = crudeStates[key]
    if not state then
        local modifier = caster:AddNewModifier(caster, ability, "modifier_item_enhancement_crude", {})
        if not modifier then return nil end
        state = { modifier = modifier, count = 0 }
        crudeStates[key] = state
    end
    state.count = state.count + 1
    return key
end

local function ReleaseCrude(key)
    local state = crudeStates[key]
    if not state then return end
    state.count = state.count - 1
    if state.count > 0 then return end
    if state.modifier and not state.modifier:IsNull() then
        state.modifier:Destroy()
    end
    crudeStates[key] = nil
end

local function SpendSwiftGloveCharge(caster)
    for item_slot = DOTA_ITEM_SLOT_1, DOTA_STASH_SLOT_6 do
        local item = caster:GetItemInSlot(item_slot)
        if item and item:GetName() == "item_swift_glove" then
            item:SpendCharge(1)
        end
    end
end

-- 多把无限手套的充能点数以最少的那把为准
local function SyncSwiftGloveCharges(caster, ability)
    for item_slot = DOTA_ITEM_SLOT_1, DOTA_STASH_SLOT_6 do
        local item = caster:GetItemInSlot(item_slot)
        if item and item:GetName() == "item_swift_glove" then
            local charges = item:GetCurrentCharges()
            if charges < ability:GetCurrentCharges() then
                ability:SetCurrentCharges(charges)
            end
        end
    end
end

function SwiftGloveOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability
    if not caster or not ability then return end

    ability.swift_glove_crude_key = AcquireCrude(caster, ability)
    SyncSwiftGloveCharges(caster, ability)

    -- 句柄按物品实例保存，多件时各摘各的
    local chain = ability.swift_glove_chain_modifier
    if not chain or chain:IsNull() then
        ability.swift_glove_chain_modifier = caster:AddNewModifier(caster, ability,
            "modifier_item_swift_glove_chain_lightning", {})
    end
end

function SwiftGloveOnDestroy(keys)
    if not IsServer() then return end

    local ability = keys.ability
    if not ability then return end

    if ability.swift_glove_crude_key then
        ReleaseCrude(ability.swift_glove_crude_key)
        ability.swift_glove_crude_key = nil
    end

    local chain = ability.swift_glove_chain_modifier
    ability.swift_glove_chain_modifier = nil
    if chain and not chain:IsNull() then
        chain:Destroy()
    end
end

local function ShowSwiftGloveError(caster, message)
    local player = PlayerResource:GetPlayer(caster:GetPlayerOwnerID())
    if player then
        CustomGameEventManager:Send_ServerToPlayer(player, "dota_hud_error_message", {
            reason = 0,
            message = message,
        })
    end
end

-- 点石成金
function SwiftGloveOnSpellStart(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local target = keys.target
    local ability = keys.ability
    if not caster or not target or not ability then return end

    -- 肉山能通过 KV 的兵种过滤，只能在施法时拦下；不消耗这次充能
    if target:GetUnitName() == "npc_dota_roshan" or target:IsBuilding() then
        ability:EndCooldown()
        ShowSwiftGloveError(caster, target:IsBuilding() and "#dota_hud_error_swift_glove_no_building"
            or "#dota_hud_error_swift_glove_no_roshan")
        return
    end

    -- 对英雄目标按 hero_kill_chance 概率失败，给逃过一劫的目标和施法者反馈，避免毫无手感
    if target:IsHero() and not RollPercentage(ability:GetSpecialValueFor("hero_kill_chance")) then
        target:EmitSound("DOTA_Item.LinkensSphere.Activate")
        SendOverheadEventMessage(caster, OVERHEAD_ALERT_MISS, target, 0, caster)
        SpendSwiftGloveCharge(caster)
        return
    end

    local target_pos = target:GetAbsOrigin()
    local self_xp = ability:GetSpecialValueFor("self_xp")
    local self_gold = ability:GetSpecialValueFor("self_gold")
    local group_xp = ability:GetSpecialValueFor("group_xp")
    local group_gold = ability:GetSpecialValueFor("group_gold")
    local caster_playerid = -1

    if caster then
        caster_playerid = caster:GetPlayerOwnerID()
    end

    local pfx = ParticleManager:CreateParticle("particles/items2_fx/hand_of_midas.vpcf", PATTACH_ABSORIGIN, target)
    ParticleManager:SetParticleControl(pfx, 0, target_pos)
    ParticleManager:SetParticleControl(pfx, 1, target_pos)
    ParticleManager:ReleaseParticleIndex(pfx)

    target:AddNewModifier(caster, ability, "modifier_ignore_invulnerable_kill", {})
    target:Kill(ability, caster) -- Preserve standard kill credit and death rewards.
    target:RemoveModifierByName("modifier_ignore_invulnerable_kill")
    caster:EmitSound("DOTA_Item.Hand_Of_Midas")
    caster:ModifyGoldFiltered(self_gold, true, DOTA_ModifyGold_CreepKill)
    if not caster:IsTempestDouble() then
        caster:AddExperience(target:GetDeathXP() * self_xp * AIGameMode:GetPlayerGoldXpMultiplier(caster_playerid),
            DOTA_ModifyXP_CreepKill, false, false)
    else
        -- 风暴双雄克隆体不获得经验
        print("TempestDouble does not gain swift glove experience")
    end
    SendOverheadEventMessage(caster, OVERHEAD_ALERT_GOLD, target,
        self_gold * AIGameMode:GetPlayerGoldXpMultiplier(caster_playerid), caster)

    -- 团队增益
    local playerId = caster:GetPlayerOwnerID()
    local team = caster:GetTeamNumber()
    local self_pos = caster:GetAbsOrigin()
    local all = FindUnitsInRadius(team, self_pos, nil, ability:GetSpecialValueFor("group_range"),
        DOTA_UNIT_TARGET_TEAM_FRIENDLY,
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS,
        FIND_ANY_ORDER, false)
    for _, teammate in pairs(all) do
        if teammate:GetPlayerOwnerID() ~= playerId and teammate:IsRealHero() and not teammate:IsTempestDouble() then
            local teammate_playerid = teammate:GetPlayerOwnerID()
            teammate:EmitSound("DOTA_Item.Hand_Of_Midas")
            teammate:ModifyGoldFiltered(group_gold, true, DOTA_ModifyGold_CreepKill)
            teammate:AddExperience(
                target:GetDeathXP() * group_xp * AIGameMode:GetPlayerGoldXpMultiplier(teammate_playerid),
                DOTA_ModifyXP_CreepKill, false, false)
            SendOverheadEventMessage(teammate, OVERHEAD_ALERT_GOLD, teammate,
                group_gold * AIGameMode:GetPlayerGoldXpMultiplier(teammate_playerid), caster)
        end
    end

    SpendSwiftGloveCharge(caster)
end

function modifier_item_swift_glove_chain_lightning:IsHidden() return true end

function modifier_item_swift_glove_chain_lightning:IsPurgable() return false end

function modifier_item_swift_glove_chain_lightning:RemoveOnDeath() return false end

function modifier_item_swift_glove_chain_lightning:GetAttributes()
    return MODIFIER_ATTRIBUTE_PERMANENT + MODIFIER_ATTRIBUTE_MULTIPLE + MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
end

function modifier_item_swift_glove_chain_lightning:OnCreated(params)
    self:OnRefresh(params)
end

function modifier_item_swift_glove_chain_lightning:OnRefresh(params)
    local ability = self:GetAbility()
    self.chain_chance = ability:GetSpecialValueFor("chain_chance")
    self.chain_damage = ability:GetSpecialValueFor("chain_damage")
    self.chain_strikes = ability:GetSpecialValueFor("chain_strikes")
    self.chain_radius = ability:GetSpecialValueFor("chain_radius")
    self.chain_cooldown = ability:GetSpecialValueFor("chain_cooldown")
    self.double_damage_chance = ability:GetSpecialValueFor("double_damage_chance")
    self.double_damage_multiplier = ability:GetSpecialValueFor("double_damage_multiplier")
    self.double_damage_cooldown = ability:GetSpecialValueFor("double_damage_cooldown")
    self.quintuple_damage_chance = ability:GetSpecialValueFor("quintuple_damage_chance")
    self.quintuple_damage_multiplier = ability:GetSpecialValueFor("quintuple_damage_multiplier")
    self.quintuple_damage_cooldown = ability:GetSpecialValueFor("quintuple_damage_cooldown")
    self.decuple_damage_chance = ability:GetSpecialValueFor("decuple_damage_chance")
    self.decuple_damage_multiplier = ability:GetSpecialValueFor("decuple_damage_multiplier")
    self.decuple_damage_cooldown = ability:GetSpecialValueFor("decuple_damage_cooldown")
    self.last_proc_time = self.last_proc_time or -999
end

function modifier_item_swift_glove_chain_lightning:DeclareFunctions()
    return {
        MODIFIER_EVENT_ON_ATTACK_LANDED,
    }
end

function modifier_item_swift_glove_chain_lightning:OnAttackLanded(params)
    if not IsServer() then return end
    if params.attacker ~= self:GetParent() then return end
    if not params.target or params.target:IsNull() then return end
    if params.target:IsBuilding() then return end
    if params.target:GetTeamNumber() == self:GetParent():GetTeamNumber() then return end
    if params.target:IsMagicImmune() then return end

    local now = GameRules:GetGameTime()
    if now < self.last_proc_time + (self.current_cooldown or self.chain_cooldown) then return end
    if not RollPercentage(self.chain_chance) then return end

    local multiplier, cooldown = self:GetDamageMultiplier()
    self.current_cooldown = cooldown
    self.last_proc_time = now
    self:FireChainLightning(params.target, self.chain_damage * multiplier)
end

function modifier_item_swift_glove_chain_lightning:GetDamageMultiplier()
    local roll = RandomFloat(0, 100)
    if roll <= self.decuple_damage_chance then
        return self.decuple_damage_multiplier, self.decuple_damage_cooldown
    end
    if roll <= self.decuple_damage_chance + self.quintuple_damage_chance then
        return self.quintuple_damage_multiplier, self.quintuple_damage_cooldown
    end
    if roll <= self.decuple_damage_chance + self.quintuple_damage_chance + self.double_damage_chance then
        return self.double_damage_multiplier, self.double_damage_cooldown
    end
    return 1, self.chain_cooldown
end

function modifier_item_swift_glove_chain_lightning:FireChainLightning(first_target, damage)
    local caster = self:GetParent()
    local ability = self:GetAbility()
    local hit_targets = {}
    local current_target = first_target
    local previous_target = caster

    for _ = 1, self.chain_strikes do
        if not current_target or current_target:IsNull() then return end

        hit_targets[current_target:entindex()] = true
        self:CreateChainLightningEffect(previous_target, current_target)
        EmitSoundOn("Item.Maelstrom.Chain_Lightning", current_target)
        ApplyDamage({
            victim = current_target,
            attacker = caster,
            damage = damage,
            damage_type = DAMAGE_TYPE_MAGICAL,
            ability = ability
        })

        local next_target = nil
        local enemies = FindUnitsInRadius(caster:GetTeamNumber(), current_target:GetAbsOrigin(), nil, self.chain_radius,
            DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
            DOTA_UNIT_TARGET_FLAG_NONE, FIND_CLOSEST, false)
        for _, enemy in pairs(enemies) do
            if enemy and not enemy:IsNull() and not enemy:IsBuilding() and not hit_targets[enemy:entindex()] then
                next_target = enemy
                break
            end
        end
        previous_target = current_target
        current_target = next_target
    end
end

function modifier_item_swift_glove_chain_lightning:CreateChainLightningEffect(source, target)
    local particle = ParticleManager:CreateParticle("particles/items_fx/chain_lightning.vpcf", PATTACH_ABSORIGIN_FOLLOW,
        source)
    ParticleManager:SetParticleControlEnt(particle, 0, source, PATTACH_POINT_FOLLOW, "attach_hitloc",
        source:GetAbsOrigin(), true)
    ParticleManager:SetParticleControlEnt(particle, 1, target, PATTACH_POINT_FOLLOW, "attach_hitloc",
        target:GetAbsOrigin(), true)
    ParticleManager:ReleaseParticleIndex(particle)
end
