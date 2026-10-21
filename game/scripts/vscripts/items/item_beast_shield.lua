function BeastShieldOnSpellStart(keys)
    local caster = keys.caster
    local ability = keys.ability

    if not caster or not ability then return end

    local duration = ability:GetSpecialValueFor("active_duration")
    caster:AddNewModifier(caster, ability, "modifier_black_king_bar_immune", { duration = duration })
end
