--[[ 永恒护符：对友方英雄强驱散并给永恒守护，被动免死交给原版永恒之盘，触发时对自己再放一次。 ]]

local AEON_DISK_BUFF = "modifier_item_aeon_disk_buff"
local GUARD_MODIFIER = "modifier_item_aeon_amulet_guard"
local HEAL_MODIFIER = "modifier_item_aeon_amulet_heal"
-- 减速抗性与状态抗性 KV 写了不生效，只能借中立强化的原版 modifier，数值由本物品同名字段提供
local SLOW_RESIST_MODIFIER = "modifier_item_enhancement_brawny"
local STATUS_RESIST_MODIFIER = "modifier_item_enhancement_titanic"
-- 原版通用隐身，攻击或施法后自行现形
local INVISIBLE_MODIFIER = "modifier_invisible"
-- KV ApplyModifier 挂不上永恒之盘，滋补还会多挂且不摘，只能脚本按物品实例存句柄
local VANILLA_MODIFIERS = {
    "modifier_item_aeon_disk",
    "modifier_item_enhancement_restorative",
}

-- 单位 entindex -> 剩余回复次数与每次回复量，重复施加守护时覆盖即重新计次
local healStates = {}

-- 主动与免死触发共用；免死 buff 自带状态抗性，被动路径不再挂一份，避免叠成约 96%
local function Protect(unit, ability, withStatusResist)
    unit:EmitSound("Item.StarEmblem.Friendly")
    unit:Purge(false, true, false, true, true)

    local duration = ability:GetSpecialValueFor("guard_duration")
    ApplyItemDataDrivenModifier(nil, unit, unit, GUARD_MODIFIER, { duration = duration })

    -- KV 的生命回复不计入治疗统计，所以用定时 Heal
    local interval = ability:GetSpecialValueFor("guard_heal_interval")
    local ticks = duration / interval
    healStates[unit:entindex()] = {
        ticksLeft = ticks,
        heal = ability:GetSpecialValueFor("guard_heal") / ticks,
        healPct = ability:GetSpecialValueFor("guard_heal_pct") / 100 / ticks,
    }
    ability:ApplyDataDrivenModifier(unit, unit, HEAL_MODIFIER, { duration = duration })

    unit:AddNewModifier(unit, ability, INVISIBLE_MODIFIER, { duration = duration })
    unit:AddNewModifier(unit, ability, SLOW_RESIST_MODIFIER, { duration = duration })
    if withStatusResist then
        unit:AddNewModifier(unit, ability, STATUS_RESIST_MODIFIER, { duration = duration })
    end
end

function AeonAmuletOnCreated(keys)
    if not IsServer() then return end

    local unit = keys.caster
    local ability = keys.ability
    if not unit or not ability or ability.aeonState then return end

    local state = { unit = unit, modifiers = {} }
    ability.aeonState = state
    for _, name in ipairs(VANILLA_MODIFIERS) do
        local modifier = unit:AddNewModifier(unit, ability, name, {})
        if modifier then
            table.insert(state.modifiers, modifier)
        end
    end

    ModifierEventRegisterModifierAdded(unit, state, function(event)
        local buff = event.added_buff
        if buff:GetName() ~= AEON_DISK_BUFF then return end

        -- 多件叠加时每件都登记了监听，只有挂出该 buff 的那件负责
        local buffAbility = buff:GetAbility()
        if buffAbility ~= nil and buffAbility ~= ability then return end

        Protect(unit, ability, false)
    end)
end

function AeonAmuletOnDestroy(keys)
    if not IsServer() then return end

    local ability = keys.ability
    local state = ability and ability.aeonState
    if not state then return end
    ability.aeonState = nil

    for _, modifier in ipairs(state.modifiers) do
        if not modifier:IsNull() then
            modifier:Destroy()
        end
    end
    if not state.unit:IsNull() then
        ModifierEventUnregisterModifierAdded(state.unit, state)
    end
end

function AeonAmuletOnSpellStart(keys)
    local caster = keys.caster
    local target = keys.target
    local ability = keys.ability
    if not caster or not target or not ability then return end

    if PlayerResource:IsDisableHelpSetForPlayerID(target:GetPlayerOwnerID(), caster:GetPlayerOwnerID()) then
        ability:EndCooldown()
        ability:RefundManaCost()
        return
    end

    Protect(target, ability, true)
    if target ~= caster then
        Protect(caster, ability, true)
    end
end

function AeonAmuletHealTick(keys)
    local unit = keys.target
    local state = unit and healStates[unit:entindex()]
    if not state then return end

    unit:Heal(state.heal + unit:GetMaxHealth() * state.healPct, keys.ability)

    state.ticksLeft = state.ticksLeft - 1
    if state.ticksLeft <= 0 then
        healStates[unit:entindex()] = nil
    end
end
