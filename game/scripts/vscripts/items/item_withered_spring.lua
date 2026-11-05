--[[ 生命之心：免死判定交给原版永恒之盘，力量与回复借原版龙心，触发瞬间连带放一次枯木逢春。 ]]

local AEON_DISK_BUFF = "modifier_item_aeon_disk_buff"
local ACTIVE_MODIFIER = "modifier_item_withered_spring_active"
-- 原版 modifier 的数值都取本物品的 AbilityValues；句柄按物品实例保存，多件时各摘各的
local VANILLA_MODIFIERS = {
    "modifier_item_aeon_disk",
    "modifier_item_heart",
}

local function Replenish(unit, ability)
    unit:EmitSound("Item.GuardianGreaves.Activate")
    local casterFx = ParticleManager:CreateParticle("particles/items3_fx/warmage.vpcf", PATTACH_ABSORIGIN, unit)
    ParticleManager:ReleaseParticleIndex(casterFx)

    ApplyItemDataDrivenModifier(nil, unit, unit, ACTIVE_MODIFIER, {
        duration = ability:GetSpecialValueFor("active_duration"),
    })
    unit:Purge(false, true, false, true, true)

    local replenishHealth = ability:GetSpecialValueFor("replenish_health")
    local replenishHealthPct = ability:GetSpecialValueFor("replenish_health_pct")
    local replenishMana = ability:GetSpecialValueFor("replenish_mana")

    local allies = FindUnitsInRadius(
        unit:GetTeamNumber(),
        unit:GetAbsOrigin(),
        nil,
        ability:GetSpecialValueFor("replenish_radius"),
        DOTA_UNIT_TARGET_TEAM_FRIENDLY,
        DOTA_UNIT_TARGET_HERO,
        DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS,
        FIND_ANY_ORDER,
        false
    )

    for _, ally in ipairs(allies) do
        local healAmount = replenishHealth + ally:GetMaxHealth() * replenishHealthPct / 100
        ally:Heal(healAmount, ability)
        ally:GiveMana(replenishMana)
        SendOverheadEventMessage(nil, OVERHEAD_ALERT_HEAL, ally, healAmount, nil)
        SendOverheadEventMessage(nil, OVERHEAD_ALERT_MANA_ADD, ally, replenishMana, nil)

        local allyFx = ParticleManager:CreateParticle(
            "particles/items3_fx/warmage_recipient.vpcf",
            PATTACH_ABSORIGIN_FOLLOW,
            ally
        )
        ParticleManager:ReleaseParticleIndex(allyFx)
    end
end

function WitheredSpringOnCreated(keys)
    if not IsServer() then return end

    local unit = keys.caster
    local ability = keys.ability
    if not unit or not ability or ability.springState then return end

    local state = { unit = unit, modifiers = {} }
    ability.springState = state
    for _, name in ipairs(VANILLA_MODIFIERS) do
        local modifier = unit:AddNewModifier(unit, ability, name, {})
        if modifier then
            table.insert(state.modifiers, modifier)
        end
    end

    ModifierEventRegisterModifierAdded(unit, state, function(event)
        local buff = event.added_buff
        if buff:GetName() ~= AEON_DISK_BUFF then return end

        -- 多件叠加时每件都登记了监听，只有挂出该 buff 的那件负责回复
        local buffAbility = buff:GetAbility()
        if buffAbility ~= nil and buffAbility ~= ability then return end

        -- 监听回调里没有施法者，持有者取登记时存下的单位
        Replenish(state.unit, ability)
    end)
end

function WitheredSpringOnDestroy(keys)
    if not IsServer() then return end

    local ability = keys.ability
    local state = ability and ability.springState
    if not state then return end
    ability.springState = nil

    for _, modifier in ipairs(state.modifiers) do
        if not modifier:IsNull() then
            modifier:Destroy()
        end
    end
    if not state.unit:IsNull() then
        ModifierEventUnregisterModifierAdded(state.unit, state)
    end
end

function WitheredSpringOnSpellStart(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability
    if not caster or not ability then return end

    Replenish(caster, ability)
end
