function TreasureConsumableSpendCharge(keys)
    keys.ability:SpendCharge(1)
end

function TreasureCheeseOnSpell(keys)
    local caster = keys.caster
    local ability = keys.ability
    caster:Heal(ability:GetSpecialValueFor("health_restore"), ability)
    caster:GiveMana(ability:GetSpecialValueFor("mana_restore"))
    ability:SpendCharge(1)
end
