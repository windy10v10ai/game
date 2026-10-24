-- 六脉神剑：属性全部交给原生 modifier，以本物品为数值来源
-- 三叉戟不属于散华/夜叉/慧光家族，多件之间正常叠加；「神秘」只读 manacost_reduction，其余字段本物品没有，读到 0
local VANILLA_MODIFIERS = { "modifier_item_trident", "modifier_item_enhancement_mystical" }

function SixVeinOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability
    if not caster or not ability then return end

    ability.added_modifiers = ability.added_modifiers or {}
    for _, name in ipairs(VANILLA_MODIFIERS) do
        local modifier = caster:AddNewModifier(caster, ability, name, {})
        if modifier then
            table.insert(ability.added_modifiers, modifier)
        end
    end
end

-- 按句柄销毁，不误删其他来源（中立物品格、另一件六脉）挂的同名 modifier
function SixVeinOnDestroy(keys)
    if not IsServer() then return end

    local ability = keys.ability
    if not ability or not ability.added_modifiers then return end

    for _, modifier in pairs(ability.added_modifiers) do
        if modifier and not modifier:IsNull() then
            modifier:Destroy()
        end
    end
    ability.added_modifiers = nil
end
