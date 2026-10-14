-- 吸血光环：光环 buff 出现时登记为单位的吸血来源
local AURA_MODIFIER = "modifier_item_vladmir_2_general_aura"

function VampiricAuraCreated(event)
    local target = event.target
    local ability = event.ability
    if not target or not ability then return end

    for _, aura in pairs(target:FindAllModifiersByName(AURA_MODIFIER)) do
        if aura:GetAbility() == ability then
            LifestealSet(target, aura, ability:GetSpecialValueFor("vampiric_aura"), 0)
            return
        end
    end
end

-- 光环结束时物品可能已不在，拿不到对应 buff，等 buff 失效后再剔除
function VampiricAuraDestroyed(event)
    local target = event.target
    if not target then return end

    Timers:CreateTimer(0, function()
        if not target:IsNull() then
            LifestealPrune(target)
        end
    end)
end
