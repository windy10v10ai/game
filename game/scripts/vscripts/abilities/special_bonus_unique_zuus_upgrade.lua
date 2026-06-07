function OnAbilityExecuted(keys)
    local ability_executed = keys.event_ability

    if ability_executed:GetAbilityName() == "zuus_arc_lightning" or ability_executed:GetAbilityName() == "zuus_lightning_bolt" then
        local caster = keys.caster

        local upgrade_ability = caster:FindAbilityByName("special_bonus_unique_zuus_upgrade")

        -- Check autocast state and scepter
        local has_autocast = upgrade_ability:GetAutoCastState()
        if not has_autocast then
            return
        end
        local target = keys.target
        local aoe_radius = keys.aoe_radius
        -- 雷击之矛可能作用多个目标，需要查找范围内所有敌人
        if ability_executed:GetAbilityName() == "zuus_lightning_bolt" and aoe_radius > 0 then
            local cast_position = ability_executed:GetCursorPosition()
            local enemies = FindUnitsInRadius(
                caster:GetTeamNumber(),
                cast_position,
                nil,
                aoe_radius,
                DOTA_UNIT_TARGET_TEAM_ENEMY,
                DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC,
                DOTA_UNIT_TARGET_FLAG_NONE,
                FIND_ANY_ORDER,
                false
            )

            for _, enemy in ipairs(enemies) do
                caster:PerformAttack(enemy, true, true, true, false, true, false, true)
            end
        else
            -- 弧形闪电是单体目标，直接攻击
            if target then
                caster:PerformAttack(target, true, true, true, false, true, false, true)
            end
        end
    end
end
