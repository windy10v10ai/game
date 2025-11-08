function BeastShieldOnCreated(keys)
    if not IsServer() then return end

    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    caster:AddNewModifier(caster, ability, "modifier_item_eternal_shroud", {})
end

function BeastShieldOnDestroy(keys)
    if not IsServer() then return end

    local caster = keys.caster

    if not caster then return end

    caster:RemoveModifierByName("modifier_item_eternal_shroud")
end
