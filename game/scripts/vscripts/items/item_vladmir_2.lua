function VampiricAuraApply(event)
    -- Variables
    local attacker = event.attacker
    local ability = event.inflictor
    local iLifeSteal = 25
	event.damage = event.attack_damage
	LifeStealOnAttackLanded(event, iLifeSteal, attacker, ability)
end
