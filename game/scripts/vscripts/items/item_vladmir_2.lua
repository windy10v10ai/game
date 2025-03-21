function VampiricAuraApply(event)
    -- Variables
    local attacker = event.attacker
    local iLifeSteal = 25
    event.damage = CalculateActualDamage(event.attack_damage, event.target)
    event.damage_type = DAMAGE_TYPE_PHYSICAL
    event.damage_flags = 0
    event.unit = event.target

    TsLifeStealOnAttackLanded(_, event, iLifeSteal, attacker)
end
