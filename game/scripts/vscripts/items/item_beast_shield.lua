function BeastShieldOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    -- 添加原生 Eternal Shroud modifier
    local eternal_shroud_modifier = caster:AddNewModifier(caster, ability, "modifier_item_eternal_shroud", {})

    -- 将添加的 modifier 保存到 ability 上,以便 OnDestroy 时精确移除
    if not ability.added_modifiers then
        ability.added_modifiers = {}
    end

    if eternal_shroud_modifier then
        table.insert(ability.added_modifiers, eternal_shroud_modifier)
    end
end

function BeastShieldOnDestroy(keys)
    if not IsServer() then return end

    local ability = keys.ability

    if not ability or not ability.added_modifiers then return end

    -- 只移除此物品实例添加的 modifier
    for _, modifier in pairs(ability.added_modifiers) do
        if modifier and not modifier:IsNull() then
            modifier:Destroy()
        end
    end

    -- 清空记录
    ability.added_modifiers = nil
end
