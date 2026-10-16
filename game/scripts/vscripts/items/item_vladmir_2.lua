-- 原版光环按本物品的同名字段提供吸血、攻击力、回蓝
local NATIVE_AURA = "modifier_item_vladmir"

function NativeAuraCreated(event)
    local caster = event.caster
    if not caster or not event.ability then return end
    caster:AddNewModifier(caster, event.ability, NATIVE_AURA, {})
end

-- 物品卖掉时来源可能已失效，失效来源的光环一并清掉
function NativeAuraDestroyed(event)
    local caster = event.caster
    if not caster or caster:IsNull() then return end

    for _, aura in pairs(caster:FindAllModifiersByName(NATIVE_AURA)) do
        local source = aura:GetAbility()
        if not source or source:IsNull() or source == event.ability then
            aura:Destroy()
        end
    end
end
